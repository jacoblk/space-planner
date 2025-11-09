/**
 * Canvas component - handles rendering and all user interactions
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  Space,
  SpaceObject,
  Viewport,
  InteractionMode,
  Point,
  ScreenPoint,
  PolygonEditState,
  Polygon
} from './types';
import {
  worldToScreen,
  screenToWorld,
  getObjectWorldPolygon,
  isPointOnRotationHandle,
  getRotationHandlePosition,
  calculateRotationAngle,
  findObjectAtPoint,
  isObjectInsideSpace,
  getPolygonBounds,
  constrainPositionToSpace
} from './geometry';

interface CanvasProps {
  space: Space;
  objects: SpaceObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObjectPosition: (id: string, position: Point) => void;
  onUpdateObjectRotation: (id: string, rotation: number) => void;
  polygonEditState: PolygonEditState | null;
  onUpdatePolygonEditState: (state: PolygonEditState | null) => void;
  onUpdateSpaceOutline: (outline: Polygon) => void;
  onUpdateObjectShape: (id: string, shape: Polygon) => void;
  onResetViewReady?: (resetView: () => void) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  space,
  objects,
  selectedObjectId,
  onSelectObject,
  onUpdateObjectPosition,
  onUpdateObjectRotation,
  polygonEditState,
  onUpdatePolygonEditState,
  onUpdateSpaceOutline,
  onUpdateObjectShape,
  onResetViewReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewport, setViewport] = useState<Viewport>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    baseScale: 1,
    zoomLevel: 1
  });

  const [mode, setMode] = useState<InteractionMode>('idle');
  const [dragStart, setDragStart] = useState<ScreenPoint | null>(null);
  const [draggedObjectId, setDraggedObjectId] = useState<string | null>(null);
  const [dragObjectStartPos, setDragObjectStartPos] = useState<Point | null>(null);
  const [rotationStartAngle, setRotationStartAngle] = useState<number>(0);

  // Touch state for pinch-to-zoom
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialPinchZoom, setInitialPinchZoom] = useState<number>(1);
  const [initialPinchWorldPoint, setInitialPinchWorldPoint] = useState<Point | null>(null);

  // Polygon editing state
  const [mousePosition, setMousePosition] = useState<ScreenPoint | null>(null);
  const [vertexDragStart, setVertexDragStart] = useState<Point | null>(null);

  // Track if viewport has been initialized
  const viewportInitialized = useRef(false);

  // Function to reset viewport to fit space
  const resetViewport = React.useCallback(() => {
    if (!containerRef.current) return;

    const bounds = getPolygonBounds(space.outline);
    const spaceWidth = (bounds.maxX - bounds.minX) / 10; // in inches
    const spaceHeight = (bounds.maxY - bounds.minY) / 10; // in inches

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const scaleX = containerWidth / (spaceWidth * 1.2); // 1.2 for padding
    const scaleY = containerHeight / (spaceHeight * 1.2);
    const baseScale = Math.min(scaleX, scaleY);

    setViewport({
      offsetX: -(bounds.minX / 10) + (containerWidth / baseScale - spaceWidth) / 2,
      offsetY: -(bounds.minY / 10) + (containerHeight / baseScale - spaceHeight) / 2,
      baseScale,
      scale: baseScale,
      zoomLevel: 1
    });
  }, [space]);

  // Calculate initial viewport to fit space (only on mount)
  useEffect(() => {
    if (!viewportInitialized.current) {
      resetViewport();
      viewportInitialized.current = true;
    }
  }, [resetViewport]);

  // Expose reset view function to parent
  useEffect(() => {
    if (onResetViewReady) {
      onResetViewReady(resetViewport);
    }
  }, [onResetViewReady, resetViewport]);

  // Helper functions for polygon editing
  const getEditingPolygonWorldPoints = (): Point[] | null => {
    if (!polygonEditState) return null;
    if (polygonEditState.target.type === 'space') {
      return space.outline.points;
    } else {
      const obj = objects.find(o => o.id === (polygonEditState.target as { type: 'object'; objectId: string }).objectId);
      if (!obj) return null;
      // For objects, we need to transform shape points to world coordinates
      return getObjectWorldPolygon(obj).points;
    }
  };

  const findVertexAtPoint = (screenPoint: ScreenPoint): number | null => {
    const worldPoints = getEditingPolygonWorldPoints();
    if (!worldPoints) return null;

    const hitRadius = 10; // pixels

    for (let i = 0; i < worldPoints.length; i++) {
      const screenPos = worldToScreen(worldPoints[i], viewport);
      const dx = screenPos.x - screenPoint.x;
      const dy = screenPos.y - screenPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= hitRadius) {
        return i;
      }
    }

    return null;
  };

  const findEdgeAtPoint = (screenPoint: ScreenPoint): number | null => {
    const worldPoints = getEditingPolygonWorldPoints();
    if (!worldPoints) return null;

    const hitRadius = 8; // pixels

    for (let i = 0; i < worldPoints.length; i++) {
      const p1 = worldPoints[i];
      const p2 = worldPoints[(i + 1) % worldPoints.length];
      const s1 = worldToScreen(p1, viewport);
      const s2 = worldToScreen(p2, viewport);

      // Calculate distance from point to line segment
      const A = screenPoint.x - s1.x;
      const B = screenPoint.y - s1.y;
      const C = s2.x - s1.x;
      const D = s2.y - s1.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;

      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;

      if (param < 0) {
        xx = s1.x;
        yy = s1.y;
      } else if (param > 1) {
        xx = s2.x;
        yy = s2.y;
      } else {
        xx = s1.x + param * C;
        yy = s1.y + param * D;
      }

      const dx = screenPoint.x - xx;
      const dy = screenPoint.y - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= hitRadius && param >= 0 && param <= 1) {
        return i;
      }
    }

    return null;
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw space outline
    ctx.save();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    space.outline.points.forEach((point, i) => {
      const screen = worldToScreen(point, viewport);
      if (i === 0) {
        ctx.moveTo(screen.x, screen.y);
      } else {
        ctx.lineTo(screen.x, screen.y);
      }
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Draw objects (sorted by z-index)
    const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex);

    sortedObjects.forEach(obj => {
      const worldPolygon = getObjectWorldPolygon(obj);
      const isSelected = obj.id === selectedObjectId;

      ctx.save();

      // Draw object
      ctx.fillStyle = isSelected ? 'rgba(100, 150, 255, 0.3)' : 'rgba(200, 200, 200, 0.5)';
      ctx.strokeStyle = isSelected ? '#4080ff' : '#666';
      ctx.lineWidth = isSelected ? 3 : 2;

      ctx.beginPath();
      worldPolygon.points.forEach((point, i) => {
        const screen = worldToScreen(point, viewport);
        if (i === 0) {
          ctx.moveTo(screen.x, screen.y);
        } else {
          ctx.lineTo(screen.x, screen.y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Draw label
      const centerScreen = worldToScreen(obj.position, viewport);
      ctx.save();
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Measure text for background
      const textMetrics = ctx.measureText(obj.name);
      const padding = 6;
      const bgWidth = textMetrics.width + padding * 2;
      const bgHeight = 20;

      // Draw semi-transparent background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(
        centerScreen.x - bgWidth / 2,
        centerScreen.y - bgHeight / 2,
        bgWidth,
        bgHeight
      );

      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(obj.name, centerScreen.x, centerScreen.y);

      ctx.restore();

      // Draw rotation handle for selected object
      if (isSelected) {
        const handlePos = getRotationHandlePosition(obj, viewport);

        // Draw line from object to handle
        ctx.save();
        ctx.strokeStyle = '#4080ff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerScreen.x, centerScreen.y);
        ctx.lineTo(handlePos.x, handlePos.y);
        ctx.stroke();
        ctx.restore();

        // Draw handle (larger for better touch support)
        ctx.save();
        ctx.fillStyle = '#4080ff';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(handlePos.x, handlePos.y, 16, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw rotating arrow icon
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // Draw circular arrow (270 degree arc)
        ctx.beginPath();
        ctx.arc(handlePos.x, handlePos.y, 8, -Math.PI / 4, (3 * Math.PI) / 2, false);
        ctx.stroke();

        // Draw arrowhead
        const arrowX = handlePos.x - 8 * Math.cos(Math.PI / 4);
        const arrowY = handlePos.y - 8 * Math.sin(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 3, arrowY - 3);
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX + 3, arrowY - 3);
        ctx.stroke();

        ctx.restore();
      }
    });

    // Draw polygon editing UI
    if (polygonEditState) {
      const worldPoints = getEditingPolygonWorldPoints();
      if (worldPoints) {
        // Draw edges with highlight
        ctx.save();
        worldPoints.forEach((point, i) => {
          const nextPoint = worldPoints[(i + 1) % worldPoints.length];
          const s1 = worldToScreen(point, viewport);
          const s2 = worldToScreen(nextPoint, viewport);

          const isHoveredEdge = polygonEditState.hoveredEdgeIndex === i;
          const isMeasurementEdge = polygonEditState.measurementEdgeIndex === i;

          ctx.strokeStyle = isMeasurementEdge ? '#10b981' : (isHoveredEdge ? '#f59e0b' : '#4080ff');
          ctx.lineWidth = isHoveredEdge || isMeasurementEdge ? 4 : 3;
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();

          // Draw edge midpoint for adding vertices
          if (isHoveredEdge) {
            const midX = (s1.x + s2.x) / 2;
            const midY = (s1.y + s2.y) / 2;
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(midX, midY, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
        ctx.restore();

        // Draw vertices
        ctx.save();
        worldPoints.forEach((point, i) => {
          const screenPos = worldToScreen(point, viewport);
          const isHovered = polygonEditState.hoveredVertexIndex === i;
          const isDragged = polygonEditState.draggedVertexIndex === i;

          ctx.fillStyle = isDragged ? '#ef4444' : (isHovered ? '#f59e0b' : '#4080ff');
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, isDragged || isHovered ? 8 : 6, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          // Draw vertex label
          ctx.fillStyle = '#000';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(i + 1), screenPos.x, screenPos.y - 15);
        });
        ctx.restore();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space, objects, selectedObjectId, viewport, polygonEditState, mousePosition]);

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const screenPoint: ScreenPoint = { x: screenX, y: screenY };

    // Handle polygon editing mode
    if (polygonEditState) {
      // Check if clicking on a vertex
      const vertexIndex = findVertexAtPoint(screenPoint);
      if (vertexIndex !== null) {
        setMode('dragging-vertex');
        const worldPoints = getEditingPolygonWorldPoints();
        if (worldPoints) {
          setVertexDragStart(worldPoints[vertexIndex]);
          onUpdatePolygonEditState({
            ...polygonEditState,
            draggedVertexIndex: vertexIndex,
            measurementEdgeIndex: null
          });
        }
        setDragStart(screenPoint);
        return;
      }

      // Check if clicking on an edge
      const edgeIndex = findEdgeAtPoint(screenPoint);
      if (edgeIndex !== null) {
        // If shift is held, add a new vertex
        if (e.shiftKey) {
          const worldPoint = screenToWorld(screenX, screenY, viewport);
          const worldPoints = getEditingPolygonWorldPoints();
          if (worldPoints) {
            const newPoints = [...worldPoints];
            newPoints.splice(edgeIndex + 1, 0, worldPoint);

            if (polygonEditState.target.type === 'space') {
              onUpdateSpaceOutline({ points: newPoints });
            } else {
              // For objects, we need to convert back to object-local coordinates
              const targetObjectId = (polygonEditState.target as { type: 'object'; objectId: string }).objectId;
              const obj = objects.find(o => o.id === targetObjectId);
              if (obj) {
                // Transform world points back to object-local coordinates
                const localPoints = newPoints.map(p => {
                  const dx = p.x - obj.position.x;
                  const dy = p.y - obj.position.y;
                  const angle = -obj.rotation * Math.PI / 180;
                  return {
                    x: Math.round(dx * Math.cos(angle) - dy * Math.sin(angle)),
                    y: Math.round(dx * Math.sin(angle) + dy * Math.cos(angle))
                  };
                });
                onUpdateObjectShape(targetObjectId, { points: localPoints });
              }
            }
          }
        } else {
          // Otherwise, select edge for measurement
          onUpdatePolygonEditState({
            ...polygonEditState,
            measurementEdgeIndex: edgeIndex
          });
        }
        return;
      }
    }

    // Check if clicking rotation handle
    const selectedObject = objects.find(obj => obj.id === selectedObjectId);
    if (selectedObject && isPointOnRotationHandle(screenPoint, selectedObject, viewport)) {
      setMode('dragging-rotation');
      setDraggedObjectId(selectedObject.id);
      setDragStart(screenPoint);
      const worldPoint = screenToWorld(screenX, screenY, viewport);
      setRotationStartAngle(
        calculateRotationAngle(selectedObject.position, worldPoint) - selectedObject.rotation
      );
      return;
    }

    // Check if clicking an object
    const worldPoint = screenToWorld(screenX, screenY, viewport);
    const clickedObject = findObjectAtPoint(worldPoint, objects);

    if (clickedObject) {
      onSelectObject(clickedObject.id);
      setMode('dragging-object');
      setDraggedObjectId(clickedObject.id);
      setDragStart(screenPoint);
      setDragObjectStartPos(clickedObject.position);
      return;
    }

    // Otherwise, start panning
    onSelectObject(null);
    setMode('panning');
    setDragStart(screenPoint);
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const screenPoint: ScreenPoint = { x: screenX, y: screenY };

    setMousePosition(screenPoint);

    // Update hover state in polygon editing mode
    if (polygonEditState && mode === 'idle') {
      const vertexIndex = findVertexAtPoint(screenPoint);
      const edgeIndex = vertexIndex === null ? findEdgeAtPoint(screenPoint) : null;

      if (polygonEditState.hoveredVertexIndex !== vertexIndex ||
          polygonEditState.hoveredEdgeIndex !== edgeIndex) {
        onUpdatePolygonEditState({
          ...polygonEditState,
          hoveredVertexIndex: vertexIndex,
          hoveredEdgeIndex: edgeIndex
        });
      }
    }

    if (!dragStart) return;

    // Handle vertex dragging
    if (mode === 'dragging-vertex' && polygonEditState && vertexDragStart) {
      const dx = screenX - dragStart.x;
      const dy = screenY - dragStart.y;

      const worldDx = dx / (viewport.scale * viewport.zoomLevel) * 10;
      const worldDy = dy / (viewport.scale * viewport.zoomLevel) * 10;

      const newPoint: Point = {
        x: Math.round(vertexDragStart.x + worldDx),
        y: Math.round(vertexDragStart.y + worldDy)
      };

      const worldPoints = getEditingPolygonWorldPoints();
      if (worldPoints && polygonEditState.draggedVertexIndex !== null) {
        const newPoints = [...worldPoints];
        newPoints[polygonEditState.draggedVertexIndex] = newPoint;

        if (polygonEditState.target.type === 'space') {
          onUpdateSpaceOutline({ points: newPoints });
        } else {
          // For objects, convert back to object-local coordinates
          const targetObjectId = (polygonEditState.target as { type: 'object'; objectId: string }).objectId;
          const obj = objects.find(o => o.id === targetObjectId);
          if (obj) {
            const localPoints = newPoints.map(p => {
              const dx = p.x - obj.position.x;
              const dy = p.y - obj.position.y;
              const angle = -obj.rotation * Math.PI / 180;
              return {
                x: Math.round(dx * Math.cos(angle) - dy * Math.sin(angle)),
                y: Math.round(dx * Math.sin(angle) + dy * Math.cos(angle))
              };
            });
            onUpdateObjectShape(targetObjectId, { points: localPoints });
          }
        }
      }
      return;
    }

    if (mode === 'dragging-object' && draggedObjectId && dragObjectStartPos) {
      const dx = screenX - dragStart.x;
      const dy = screenY - dragStart.y;

      const worldDx = dx / (viewport.scale * viewport.zoomLevel) * 10;
      const worldDy = dy / (viewport.scale * viewport.zoomLevel) * 10;

      const desiredPosition: Point = {
        x: Math.round(dragObjectStartPos.x + worldDx),
        y: Math.round(dragObjectStartPos.y + worldDy)
      };

      const draggedObject = objects.find(obj => obj.id === draggedObjectId);
      if (draggedObject) {
        const constrainedPosition = constrainPositionToSpace(
          draggedObject,
          desiredPosition,
          space.outline
        );
        onUpdateObjectPosition(draggedObjectId, constrainedPosition);
      }
    } else if (mode === 'dragging-rotation' && draggedObjectId) {
      const worldPoint = screenToWorld(screenX, screenY, viewport);
      const draggedObject = objects.find(obj => obj.id === draggedObjectId);

      if (draggedObject) {
        const angle = calculateRotationAngle(draggedObject.position, worldPoint);
        const newRotation = (angle - rotationStartAngle + 360) % 360;
        const testObject = { ...draggedObject, rotation: newRotation };
        if (isObjectInsideSpace(testObject, space.outline)) {
          onUpdateObjectRotation(draggedObjectId, newRotation);
        }
      }
    } else if (mode === 'panning') {
      const dx = screenX - dragStart.x;
      const dy = screenY - dragStart.y;

      const worldDx = dx / (viewport.scale * viewport.zoomLevel);
      const worldDy = dy / (viewport.scale * viewport.zoomLevel);

      setViewport(prev => ({
        ...prev,
        offsetX: prev.offsetX + worldDx,
        offsetY: prev.offsetY + worldDy
      }));

      setDragStart({ x: screenX, y: screenY });
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    if (polygonEditState && polygonEditState.draggedVertexIndex !== null) {
      onUpdatePolygonEditState({
        ...polygonEditState,
        draggedVertexIndex: null
      });
    }
    setMode('idle');
    setDragStart(null);
    setDraggedObjectId(null);
    setDragObjectStartPos(null);
    setVertexDragStart(null);
  };

  // Handle mouse wheel (zoom)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Get world point before zoom
    const worldBefore = screenToWorld(mouseX, mouseY, viewport);

    // Update zoom level
    const zoomFactor = 1.1;
    const delta = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;
    const newZoomLevel = Math.max(0.1, Math.min(10, viewport.zoomLevel * delta));

    // Get world point after zoom
    const newViewport = { ...viewport, zoomLevel: newZoomLevel };
    const worldAfter = screenToWorld(mouseX, mouseY, newViewport);

    // Adjust offset to keep mouse position steady
    const offsetDx = (worldAfter.x - worldBefore.x) / 10;
    const offsetDy = (worldAfter.y - worldBefore.y) / 10;

    setViewport({
      ...newViewport,
      offsetX: newViewport.offsetX - offsetDx,
      offsetY: newViewport.offsetY - offsetDy
    });
  };

  // Helper function to get distance between two touch points
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch, rect: DOMRect): number => {
    const x1 = touch1.clientX - rect.left;
    const y1 = touch1.clientY - rect.top;
    const x2 = touch2.clientX - rect.left;
    const y2 = touch2.clientY - rect.top;
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  // Helper function to get center point between two touches
  const getTouchCenter = (touch1: React.Touch, touch2: React.Touch, rect: DOMRect): ScreenPoint => {
    const x1 = touch1.clientX - rect.left;
    const y1 = touch1.clientY - rect.top;
    const x2 = touch2.clientX - rect.left;
    const y2 = touch2.clientY - rect.top;
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Handle pinch-to-zoom (two fingers)
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches[0], e.touches[1], rect);
      const center = getTouchCenter(e.touches[0], e.touches[1], rect);
      const worldPoint = screenToWorld(center.x, center.y, viewport);
      setInitialPinchDistance(distance);
      setInitialPinchZoom(viewport.zoomLevel);
      setInitialPinchWorldPoint(worldPoint);
      setMode('idle'); // Cancel any ongoing drag
      setDragStart(null);
      return;
    }

    // Handle single touch (same as mouse down)
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;
      const screenPoint: ScreenPoint = { x: screenX, y: screenY };

      // Handle polygon editing mode
      if (polygonEditState) {
        // Check if touching a vertex
        const vertexIndex = findVertexAtPoint(screenPoint);
        if (vertexIndex !== null) {
          setMode('dragging-vertex');
          const worldPoints = getEditingPolygonWorldPoints();
          if (worldPoints) {
            setVertexDragStart(worldPoints[vertexIndex]);
            onUpdatePolygonEditState({
              ...polygonEditState,
              draggedVertexIndex: vertexIndex,
              measurementEdgeIndex: null
            });
          }
          setDragStart(screenPoint);
          return;
        }

        // Check if touching an edge
        const edgeIndex = findEdgeAtPoint(screenPoint);
        if (edgeIndex !== null) {
          // For touch, we don't have shift key, so just select edge for measurement
          onUpdatePolygonEditState({
            ...polygonEditState,
            measurementEdgeIndex: edgeIndex
          });
          return;
        }
      }

      // Check if touching rotation handle
      const selectedObject = objects.find(obj => obj.id === selectedObjectId);
      if (selectedObject && isPointOnRotationHandle(screenPoint, selectedObject, viewport)) {
        setMode('dragging-rotation');
        setDraggedObjectId(selectedObject.id);
        setDragStart(screenPoint);
        const worldPoint = screenToWorld(screenX, screenY, viewport);
        setRotationStartAngle(
          calculateRotationAngle(selectedObject.position, worldPoint) - selectedObject.rotation
        );
        return;
      }

      // Check if touching an object
      const worldPoint = screenToWorld(screenX, screenY, viewport);
      const touchedObject = findObjectAtPoint(worldPoint, objects);

      if (touchedObject) {
        onSelectObject(touchedObject.id);
        setMode('dragging-object');
        setDraggedObjectId(touchedObject.id);
        setDragStart(screenPoint);
        setDragObjectStartPos(touchedObject.position);
        return;
      }

      // Otherwise, start panning
      onSelectObject(null);
      setMode('panning');
      setDragStart(screenPoint);
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Handle pinch-to-zoom
    if (e.touches.length === 2 && initialPinchDistance && initialPinchWorldPoint) {
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1], rect);
      const currentCenter = getTouchCenter(e.touches[0], e.touches[1], rect);

      // Calculate zoom change
      const zoomChange = currentDistance / initialPinchDistance;
      const newZoomLevel = Math.max(0.1, Math.min(10, initialPinchZoom * zoomChange));

      // Calculate new scale
      const newScale = viewport.baseScale * newZoomLevel;

      // Calculate where the initial world point would appear on screen with new zoom
      const expectedScreenX = (initialPinchWorldPoint.x / 10 + viewport.offsetX) * newScale;
      const expectedScreenY = (initialPinchWorldPoint.y / 10 + viewport.offsetY) * newScale;

      // Calculate the offset adjustment needed to make it appear at current pinch center
      const offsetDx = (currentCenter.x - expectedScreenX) / newScale;
      const offsetDy = (currentCenter.y - expectedScreenY) / newScale;

      setViewport({
        ...viewport,
        zoomLevel: newZoomLevel,
        offsetX: viewport.offsetX + offsetDx,
        offsetY: viewport.offsetY + offsetDy
      });

      return;
    }

    // Handle single touch drag (same as mouse move)
    if (e.touches.length === 1 && dragStart) {
      const touch = e.touches[0];
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;

      // Handle vertex dragging
      if (mode === 'dragging-vertex' && polygonEditState && vertexDragStart) {
        const dx = screenX - dragStart.x;
        const dy = screenY - dragStart.y;

        const worldDx = dx / (viewport.scale * viewport.zoomLevel) * 10;
        const worldDy = dy / (viewport.scale * viewport.zoomLevel) * 10;

        const newPoint: Point = {
          x: Math.round(vertexDragStart.x + worldDx),
          y: Math.round(vertexDragStart.y + worldDy)
        };

        const worldPoints = getEditingPolygonWorldPoints();
        if (worldPoints && polygonEditState.draggedVertexIndex !== null) {
          const newPoints = [...worldPoints];
          newPoints[polygonEditState.draggedVertexIndex] = newPoint;

          if (polygonEditState.target.type === 'space') {
            onUpdateSpaceOutline({ points: newPoints });
          } else {
            // For objects, convert back to object-local coordinates
            const targetObjectId = (polygonEditState.target as { type: 'object'; objectId: string }).objectId;
            const obj = objects.find(o => o.id === targetObjectId);
            if (obj) {
              const localPoints = newPoints.map(p => {
                const dx = p.x - obj.position.x;
                const dy = p.y - obj.position.y;
                const angle = -obj.rotation * Math.PI / 180;
                return {
                  x: Math.round(dx * Math.cos(angle) - dy * Math.sin(angle)),
                  y: Math.round(dx * Math.sin(angle) + dy * Math.cos(angle))
                };
              });
              onUpdateObjectShape(targetObjectId, { points: localPoints });
            }
          }
        }
        return;
      }

      if (mode === 'dragging-object' && draggedObjectId && dragObjectStartPos) {
        const dx = screenX - dragStart.x;
        const dy = screenY - dragStart.y;

        const worldDx = dx / (viewport.scale * viewport.zoomLevel) * 10;
        const worldDy = dy / (viewport.scale * viewport.zoomLevel) * 10;

        const desiredPosition: Point = {
          x: Math.round(dragObjectStartPos.x + worldDx),
          y: Math.round(dragObjectStartPos.y + worldDy)
        };

        const draggedObject = objects.find(obj => obj.id === draggedObjectId);
        if (draggedObject) {
          const constrainedPosition = constrainPositionToSpace(
            draggedObject,
            desiredPosition,
            space.outline
          );
          onUpdateObjectPosition(draggedObjectId, constrainedPosition);
        }
      } else if (mode === 'dragging-rotation' && draggedObjectId) {
        const worldPoint = screenToWorld(screenX, screenY, viewport);
        const draggedObject = objects.find(obj => obj.id === draggedObjectId);

        if (draggedObject) {
          const angle = calculateRotationAngle(draggedObject.position, worldPoint);
          const newRotation = (angle - rotationStartAngle + 360) % 360;
          const testObject = { ...draggedObject, rotation: newRotation };
          if (isObjectInsideSpace(testObject, space.outline)) {
            onUpdateObjectRotation(draggedObjectId, newRotation);
          }
        }
      } else if (mode === 'panning') {
        const dx = screenX - dragStart.x;
        const dy = screenY - dragStart.y;

        const worldDx = dx / (viewport.scale * viewport.zoomLevel);
        const worldDy = dy / (viewport.scale * viewport.zoomLevel);

        setViewport(prev => ({
          ...prev,
          offsetX: prev.offsetX + worldDx,
          offsetY: prev.offsetY + worldDy
        }));

        setDragStart({ x: screenX, y: screenY });
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Reset pinch state when fingers are lifted
    if (e.touches.length < 2) {
      setInitialPinchDistance(null);
      setInitialPinchWorldPoint(null);
    }

    // Reset drag state when all fingers are lifted
    if (e.touches.length === 0) {
      if (polygonEditState && polygonEditState.draggedVertexIndex !== null) {
        onUpdatePolygonEditState({
          ...polygonEditState,
          draggedVertexIndex: null
        });
      }
      setMode('idle');
      setDragStart(null);
      setDraggedObjectId(null);
      setDragObjectStartPos(null);
      setVertexDragStart(null);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          cursor: mode === 'panning' ? 'grabbing' : 'default',
          touchAction: 'none' // Prevent default touch behaviors
        }}
      />
    </div>
  );
};
