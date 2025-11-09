/**
 * Geometry utilities for coordinate transforms, hit detection, and collision detection
 */

import { Point, Polygon, SpaceObject, Viewport, ScreenPoint } from './types';

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(point: Point, viewport: Viewport): ScreenPoint {
  const worldX = point.x / 10; // convert tenths to inches
  const worldY = point.y / 10;

  const viewX = (worldX + viewport.offsetX) * viewport.scale * viewport.zoomLevel;
  const viewY = (worldY + viewport.offsetY) * viewport.scale * viewport.zoomLevel;

  return { x: viewX, y: viewY };
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(x: number, y: number, viewport: Viewport): Point {
  const viewX = x / (viewport.scale * viewport.zoomLevel);
  const viewY = y / (viewport.scale * viewport.zoomLevel);

  const worldX = viewX - viewport.offsetX;
  const worldY = viewY - viewport.offsetY;

  return {
    x: Math.round(worldX * 10), // convert inches to tenths
    y: Math.round(worldY * 10)
  };
}

/**
 * Test if a point is inside a polygon using ray-casting algorithm
 */
export function isPointInPolygon(point: Point, polygon: Polygon): boolean {
  const { points } = polygon;
  if (points.length < 3) return false;

  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Rotate a point around origin by given angle (in degrees)
 */
export function rotatePoint(point: Point, angle: number): Point {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: Math.round(point.x * cos - point.y * sin),
    y: Math.round(point.x * sin + point.y * cos)
  };
}

/**
 * Get the polygon of an object in world coordinates (with rotation and position)
 */
export function getObjectWorldPolygon(obj: SpaceObject): Polygon {
  return {
    points: obj.shape.points.map(p => {
      const rotated = rotatePoint(p, obj.rotation);
      return {
        x: rotated.x + obj.position.x,
        y: rotated.y + obj.position.y
      };
    })
  };
}

/**
 * Check if a point is on the rotation handle of an object
 */
export function isPointOnRotationHandle(
  screenPoint: ScreenPoint,
  obj: SpaceObject,
  viewport: Viewport
): boolean {
  const handlePos = getRotationHandlePosition(obj, viewport);
  const dx = screenPoint.x - handlePos.x;
  const dy = screenPoint.y - handlePos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance <= 16; // 16px radius for better touch support
}

/**
 * Get the screen position of the rotation handle for an object
 */
export function getRotationHandlePosition(
  obj: SpaceObject,
  viewport: Viewport
): ScreenPoint {
  const worldPolygon = getObjectWorldPolygon(obj);

  // Find the topmost point of the object
  let minY = Infinity;
  worldPolygon.points.forEach(p => {
    if (p.y < minY) minY = p.y;
  });

  // Place handle 30px above the top in screen space
  const topPoint = worldToScreen({ x: obj.position.x, y: minY }, viewport);
  return { x: topPoint.x, y: topPoint.y - 30 };
}

/**
 * Calculate rotation angle from handle drag
 */
export function calculateRotationAngle(
  center: Point,
  mousePoint: Point
): number {
  const dx = mousePoint.x - center.x;
  const dy = mousePoint.y - center.y;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Normalize to 0-360
  angle = (angle + 360) % 360;

  return angle;
}

/**
 * Find which object is at a given world point (returns highest z-index first)
 */
export function findObjectAtPoint(
  worldPoint: Point,
  objects: SpaceObject[]
): SpaceObject | null {
  // Sort by z-index descending (highest first)
  const sorted = [...objects].sort((a, b) => b.zIndex - a.zIndex);

  for (const obj of sorted) {
    const worldPolygon = getObjectWorldPolygon(obj);
    if (isPointInPolygon(worldPoint, worldPolygon)) {
      return obj;
    }
  }

  return null;
}

/**
 * Check if all corners of an object polygon are inside the space
 */
export function isObjectInsideSpace(
  obj: SpaceObject,
  space: Polygon
): boolean {
  const worldPolygon = getObjectWorldPolygon(obj);

  // Check all corners of the object
  for (const point of worldPolygon.points) {
    if (!isPointInPolygon(point, space)) {
      return false;
    }
  }

  return true;
}

/**
 * Create a rectangle polygon centered at origin
 */
export function createRectangle(widthInches: number, heightInches: number): Polygon {
  const w = (widthInches * 10) / 2; // half width in tenths
  const h = (heightInches * 10) / 2; // half height in tenths

  return {
    points: [
      { x: -w, y: -h },
      { x: w, y: -h },
      { x: w, y: h },
      { x: -w, y: h }
    ]
  };
}

/**
 * Calculate bounds of a polygon
 */
export function getPolygonBounds(polygon: Polygon): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of polygon.points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Get the center point of a polygon
 */
export function getPolygonCenter(polygon: Polygon): Point {
  const bounds = getPolygonBounds(polygon);
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2
  };
}

/**
 * Constrain an object's position to stay within space boundaries while allowing
 * as much movement as possible. This enables sliding along walls instead of
 * blocking all movement when hitting a boundary.
 *
 * @param obj The object to constrain
 * @param desiredPosition The desired new position
 * @param space The space boundary polygon
 * @returns The constrained position (may be partial movement or original position)
 */
export function constrainPositionToSpace(
  obj: SpaceObject,
  desiredPosition: Point,
  space: Polygon
): Point {
  // Try the full desired position first
  const testObject = { ...obj, position: desiredPosition };
  if (isObjectInsideSpace(testObject, space)) {
    return desiredPosition;
  }

  // If full movement fails, try moving only in X direction (horizontal sliding)
  const xOnlyPosition: Point = { x: desiredPosition.x, y: obj.position.y };
  const testObjectX = { ...obj, position: xOnlyPosition };
  if (isObjectInsideSpace(testObjectX, space)) {
    return xOnlyPosition;
  }

  // If X movement fails, try moving only in Y direction (vertical sliding)
  const yOnlyPosition: Point = { x: obj.position.x, y: desiredPosition.y };
  const testObjectY = { ...obj, position: yOnlyPosition };
  if (isObjectInsideSpace(testObjectY, space)) {
    return yOnlyPosition;
  }

  // If both fail, keep the original position
  return obj.position;
}
