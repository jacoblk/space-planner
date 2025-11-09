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
  ScreenPoint
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
  getPolygonBounds
} from './geometry';

interface CanvasProps {
  space: Space;
  objects: SpaceObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onUpdateObjectPosition: (id: string, position: Point) => void;
  onUpdateObjectRotation: (id: string, rotation: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  space,
  objects,
  selectedObjectId,
  onSelectObject,
  onUpdateObjectPosition,
  onUpdateObjectRotation
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
  const [initialPinchCenter, setInitialPinchCenter] = useState<ScreenPoint | null>(null);

  // Calculate initial viewport to fit space
  useEffect(() => {
    if (!containerRef.current) return;

    const bounds = getPolygonBounds(space.outline);
    const spaceWidth = (bounds.maxX - bounds.minX) / 10; // in inches
    const spaceHeight = (bounds.maxY - bounds.minY) / 10; // in inches

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const scaleX = containerWidth / (spaceWidth * 1.2); // 1.2 for padding
    const scaleY = containerHeight / (spaceHeight * 1.2);
    const baseScale = Math.min(scaleX, scaleY);

    setViewport(prev => ({
      ...prev,
      offsetX: -(bounds.minX / 10) + (containerWidth / baseScale - spaceWidth) / 2,
      offsetY: -(bounds.minY / 10) + (containerHeight / baseScale - spaceHeight) / 2,
      baseScale,
      scale: baseScale
    }));
  }, [space]);

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

      // Draw rotation handle for selected object
      if (isSelected) {
        const handlePos = getRotationHandlePosition(obj, viewport);
        const centerScreen = worldToScreen(obj.position, viewport);

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
  }, [space, objects, selectedObjectId, viewport]);

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const screenPoint: ScreenPoint = { x: screenX, y: screenY };

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
    if (!canvas || !dragStart) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (mode === 'dragging-object' && draggedObjectId && dragObjectStartPos) {
      const dx = screenX - dragStart.x;
      const dy = screenY - dragStart.y;

      const worldDx = dx / (viewport.scale * viewport.zoomLevel) * 10;
      const worldDy = dy / (viewport.scale * viewport.zoomLevel) * 10;

      const newPosition: Point = {
        x: Math.round(dragObjectStartPos.x + worldDx),
        y: Math.round(dragObjectStartPos.y + worldDy)
      };

      const draggedObject = objects.find(obj => obj.id === draggedObjectId);
      if (draggedObject) {
        const testObject = { ...draggedObject, position: newPosition };
        if (isObjectInsideSpace(testObject, space.outline)) {
          onUpdateObjectPosition(draggedObjectId, newPosition);
        }
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
    setMode('idle');
    setDragStart(null);
    setDraggedObjectId(null);
    setDragObjectStartPos(null);
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
      setInitialPinchDistance(distance);
      setInitialPinchZoom(viewport.zoomLevel);
      setInitialPinchCenter(center);
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
    if (e.touches.length === 2 && initialPinchDistance && initialPinchCenter) {
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1], rect);
      const currentCenter = getTouchCenter(e.touches[0], e.touches[1], rect);

      // Calculate zoom change
      const zoomChange = currentDistance / initialPinchDistance;
      const newZoomLevel = Math.max(0.1, Math.min(10, initialPinchZoom * zoomChange));

      // Get world point before zoom at current pinch center
      const worldBefore = screenToWorld(currentCenter.x, currentCenter.y, viewport);

      // Get world point after zoom at current pinch center
      const newViewport = { ...viewport, zoomLevel: newZoomLevel };
      const worldAfter = screenToWorld(currentCenter.x, currentCenter.y, newViewport);

      // Adjust offset to keep pinch center steady
      const offsetDx = (worldAfter.x - worldBefore.x) / 10;
      const offsetDy = (worldAfter.y - worldBefore.y) / 10;

      setViewport({
        ...newViewport,
        offsetX: newViewport.offsetX - offsetDx,
        offsetY: newViewport.offsetY - offsetDy
      });

      return;
    }

    // Handle single touch drag (same as mouse move)
    if (e.touches.length === 1 && dragStart) {
      const touch = e.touches[0];
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;

      if (mode === 'dragging-object' && draggedObjectId && dragObjectStartPos) {
        const dx = screenX - dragStart.x;
        const dy = screenY - dragStart.y;

        const worldDx = dx / (viewport.scale * viewport.zoomLevel) * 10;
        const worldDy = dy / (viewport.scale * viewport.zoomLevel) * 10;

        const newPosition: Point = {
          x: Math.round(dragObjectStartPos.x + worldDx),
          y: Math.round(dragObjectStartPos.y + worldDy)
        };

        const draggedObject = objects.find(obj => obj.id === draggedObjectId);
        if (draggedObject) {
          const testObject = { ...draggedObject, position: newPosition };
          if (isObjectInsideSpace(testObject, space.outline)) {
            onUpdateObjectPosition(draggedObjectId, newPosition);
          }
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
      setInitialPinchCenter(null);
    }

    // Reset drag state when all fingers are lifted
    if (e.touches.length === 0) {
      setMode('idle');
      setDragStart(null);
      setDraggedObjectId(null);
      setDragObjectStartPos(null);
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
