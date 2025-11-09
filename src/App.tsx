/**
 * Main App component - state management and layout
 */

import React, { useState, useEffect } from 'react';
import { AppState, SpaceObject, Point, PolygonEditState, Polygon } from './types';
import { Canvas } from './Canvas';
import { SpaceEditor } from './SpaceEditor';
import { ObjectPalette } from './ObjectPalette';
import { PropertiesPanel } from './PropertiesPanel';
import { PolygonDesigner } from './PolygonDesigner';
import { getPolygonCenter, isObjectInsideSpace } from './geometry';

const STORAGE_KEY = 'space-planner-state';

// Initial state with a 12' × 10' room and a 6' × 3' sofa
const getDefaultState = (): AppState => ({
  space: {
    outline: {
      points: [
        { x: 0, y: 0 },
        { x: 1440, y: 0 }, // 144" = 12'
        { x: 1440, y: 1200 }, // 120" = 10'
        { x: 0, y: 1200 }
      ]
    }
  },
  objects: [
    {
      id: 'obj-initial-sofa',
      name: 'Sofa',
      shape: {
        points: [
          { x: -360, y: -180 }, // 72" wide (6'), 36" deep (3')
          { x: 360, y: -180 },
          { x: 360, y: 180 },
          { x: -360, y: 180 }
        ]
      },
      position: { x: 720, y: 600 }, // Center of room
      rotation: 0,
      zIndex: 1
    }
  ],
  selectedObjectId: null
});

// Load state from localStorage, fallback to default if not available or corrupted
const loadInitialState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Basic validation to ensure it has the expected structure
      if (parsed && parsed.space && parsed.objects && Array.isArray(parsed.objects)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
  }
  return getDefaultState();
};

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(loadInitialState);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [polygonEditState, setPolygonEditState] = useState<PolygonEditState | null>(null);

  // Save to localStorage whenever appState changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }, [appState]);

  // Update mobile state on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get selected object
  const selectedObject = appState.objects.find(
    obj => obj.id === appState.selectedObjectId
  ) || null;

  // Get max z-index for new objects
  const maxZIndex = appState.objects.reduce(
    (max, obj) => Math.max(max, obj.zIndex),
    0
  );

  // Get space center for placing new objects
  const spaceCenter = getPolygonCenter(appState.space.outline);

  // Handlers
  const handleSelectObject = (id: string | null) => {
    setAppState(prev => ({ ...prev, selectedObjectId: id }));
  };

  const handleUpdateObjectPosition = (id: string, position: Point) => {
    setAppState(prev => ({
      ...prev,
      objects: prev.objects.map(obj =>
        obj.id === id ? { ...obj, position } : obj
      )
    }));
  };

  const handleUpdateObjectRotation = (id: string, rotation: number) => {
    setAppState(prev => {
      const obj = prev.objects.find(o => o.id === id);
      if (!obj) return prev;

      // Check if the rotation would cause collision
      const testObject = { ...obj, rotation };
      if (!isObjectInsideSpace(testObject, prev.space.outline)) {
        // Rotation would cause object to go through wall, reject it
        return prev;
      }

      return {
        ...prev,
        objects: prev.objects.map(o =>
          o.id === id ? { ...o, rotation } : o
        )
      };
    });
  };

  const handleUpdateObjectName = (id: string, name: string) => {
    setAppState(prev => ({
      ...prev,
      objects: prev.objects.map(obj =>
        obj.id === id ? { ...obj, name } : obj
      )
    }));
  };

  const handleUpdateObjectZIndex = (id: string, zIndex: number) => {
    setAppState(prev => ({
      ...prev,
      objects: prev.objects.map(obj =>
        obj.id === id ? { ...obj, zIndex } : obj
      )
    }));
  };

  const handleAddObject = (obj: SpaceObject) => {
    setAppState(prev => ({
      ...prev,
      objects: [...prev.objects, obj],
      selectedObjectId: obj.id
    }));
  };

  const handleDeleteObject = (id: string) => {
    setAppState(prev => ({
      ...prev,
      objects: prev.objects.filter(obj => obj.id !== id),
      selectedObjectId: prev.selectedObjectId === id ? null : prev.selectedObjectId
    }));
  };

  const handleDuplicateObject = (id: string) => {
    const objectToDuplicate = appState.objects.find(obj => obj.id === id);
    if (!objectToDuplicate) return;

    // Generate unique ID for the duplicate
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    const newId = `obj-${timestamp}-${random}`;

    // Generate a unique name by checking for existing copies
    const baseName = objectToDuplicate.name.replace(/ Copy(?: \d+)?$/, '');
    const copyPattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: Copy(?: (\\d+))?)?$`);
    const existingCopies = appState.objects
      .map(obj => obj.name.match(copyPattern))
      .filter(match => match !== null)
      .map(match => {
        if (!match![1]) return match![0].includes('Copy') ? 1 : 0;
        return parseInt(match![1], 10);
      });
    const maxCopyNumber = existingCopies.length > 0 ? Math.max(...existingCopies) : 0;
    const newName = maxCopyNumber === 0 ? `${baseName} Copy` : `${baseName} Copy ${maxCopyNumber + 1}`;

    // Create the duplicate with offset position
    const duplicatedObject: SpaceObject = {
      ...objectToDuplicate,
      id: newId,
      name: newName,
      position: {
        x: objectToDuplicate.position.x + 120, // Offset by 12" (120 tenths of an inch)
        y: objectToDuplicate.position.y + 120
      },
      zIndex: maxZIndex + 1
    };

    setAppState(prev => ({
      ...prev,
      objects: [...prev.objects, duplicatedObject],
      selectedObjectId: newId
    }));
  };

  const handleUpdateState = (newState: AppState) => {
    setAppState(newState);
  };

  const handleEnterPolygonEditMode = (target: 'space' | 'object', objectId?: string) => {
    if (target === 'object') {
      // Use selected object if no objectId provided
      const targetObjectId = objectId || appState.selectedObjectId;
      if (!targetObjectId) {
        alert('Please select an object first');
        return;
      }
      setPolygonEditState({
        target: { type: 'object', objectId: targetObjectId },
        hoveredVertexIndex: null,
        hoveredEdgeIndex: null,
        draggedVertexIndex: null,
        measurementEdgeIndex: null
      });
    } else {
      setPolygonEditState({
        target: { type: 'space' },
        hoveredVertexIndex: null,
        hoveredEdgeIndex: null,
        draggedVertexIndex: null,
        measurementEdgeIndex: null
      });
    }
  };

  const handleExitPolygonEditMode = () => {
    setPolygonEditState(null);
  };

  const handleUpdateSpaceOutline = (outline: Polygon) => {
    setAppState(prev => ({
      ...prev,
      space: { outline }
    }));
  };

  const handleUpdateObjectShape = (id: string, shape: Polygon) => {
    setAppState(prev => ({
      ...prev,
      objects: prev.objects.map(obj =>
        obj.id === id ? { ...obj, shape } : obj
      )
    }));
  };

  const handleMeasurementInput = (edgeIndex: number, targetLength: number) => {
    if (!polygonEditState) return;

    const getPolygonPoints = (): Point[] | null => {
      if (polygonEditState.target.type === 'space') {
        return appState.space.outline.points;
      } else {
        const obj = appState.objects.find(o => o.id === (polygonEditState.target as { type: 'object'; objectId: string }).objectId);
        return obj ? obj.shape.points : null;
      }
    };

    const points = getPolygonPoints();
    if (!points || edgeIndex < 0 || edgeIndex >= points.length) return;

    const p1 = points[edgeIndex];
    const p2 = points[(edgeIndex + 1) % points.length];

    // Calculate current edge length and direction
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const currentLength = Math.sqrt(dx * dx + dy * dy);

    if (currentLength === 0) return;

    // Calculate scale factor
    const scale = targetLength / currentLength;

    // Update p2 to match target length
    const newP2: Point = {
      x: Math.round(p1.x + dx * scale),
      y: Math.round(p1.y + dy * scale)
    };

    const newPoints = [...points];
    newPoints[(edgeIndex + 1) % points.length] = newP2;

    if (polygonEditState.target.type === 'space') {
      handleUpdateSpaceOutline({ points: newPoints });
    } else {
      handleUpdateObjectShape((polygonEditState.target as { type: 'object'; objectId: string }).objectId, { points: newPoints });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Left sidebar - hidden on mobile unless toggled */}
      {(!isMobile || showLeftPanel) && (
        <div
          style={{
            width: isMobile ? '100%' : '300px',
            display: 'flex',
            flexDirection: 'column',
            borderRight: isMobile ? 'none' : '1px solid #ddd',
            backgroundColor: '#f9f9f9',
            position: isMobile ? 'absolute' : 'static',
            top: 0,
            left: 0,
            bottom: isMobile ? '60px' : 0,
            zIndex: 10,
            boxShadow: isMobile ? '2px 0 8px rgba(0,0,0,0.2)' : 'none'
          }}
        >
          {isMobile && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fff',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '16px' }}>Objects & Properties</h2>
              <button
                onClick={() => setShowLeftPanel(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0 8px'
                }}
              >
                ×
              </button>
            </div>
          )}
          <ObjectPalette
            spaceCenter={spaceCenter}
            maxZIndex={maxZIndex}
            onAddObject={handleAddObject}
          />
          <PropertiesPanel
            selectedObject={selectedObject}
            onUpdateName={handleUpdateObjectName}
            onUpdatePosition={handleUpdateObjectPosition}
            onUpdateRotation={handleUpdateObjectRotation}
            onUpdateZIndex={handleUpdateObjectZIndex}
            onDeleteObject={handleDeleteObject}
            onDuplicateObject={handleDuplicateObject}
          />
        </div>
      )}

      {/* Canvas area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: isMobile ? '100%' : 'auto'
      }}>
        <div
          style={{
            padding: '10px',
            backgroundColor: '#fff',
            borderBottom: '1px solid #ddd',
            textAlign: 'center'
          }}
        >
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
            Space Planner
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
            {isMobile
              ? 'Tap to select • Drag to move • Drag handle to rotate • Pinch to zoom'
              : 'Click to select • Drag to move • Drag handle to rotate • Scroll to zoom'
            }
          </p>
        </div>
        <div style={{ flex: 1, marginBottom: isMobile ? '60px' : 0, position: 'relative' }}>
          <Canvas
            space={appState.space}
            objects={appState.objects}
            selectedObjectId={appState.selectedObjectId}
            onSelectObject={handleSelectObject}
            onUpdateObjectPosition={handleUpdateObjectPosition}
            onUpdateObjectRotation={handleUpdateObjectRotation}
            polygonEditState={polygonEditState}
            onUpdatePolygonEditState={setPolygonEditState}
            onUpdateSpaceOutline={handleUpdateSpaceOutline}
            onUpdateObjectShape={handleUpdateObjectShape}
          />
          <PolygonDesigner
            editState={polygonEditState}
            onEnterEditMode={handleEnterPolygonEditMode}
            onExitEditMode={handleExitPolygonEditMode}
            onMeasurementInput={handleMeasurementInput}
            currentPolygonPoints={
              polygonEditState
                ? polygonEditState.target.type === 'space'
                  ? appState.space.outline.points
                  : appState.objects.find(o => o.id === (polygonEditState.target as { type: 'object'; objectId: string }).objectId)?.shape.points || []
                : []
            }
          />
        </div>
      </div>

      {/* Right sidebar - hidden on mobile unless toggled */}
      {(!isMobile || showRightPanel) && (
        <div style={{
          width: isMobile ? '100%' : '400px',
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'absolute' : 'static',
          top: 0,
          right: 0,
          bottom: isMobile ? '60px' : 0,
          zIndex: 10,
          backgroundColor: '#fff',
          boxShadow: isMobile ? '-2px 0 8px rgba(0,0,0,0.2)' : 'none'
        }}>
          {isMobile && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fff',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '16px' }}>Space Editor</h2>
              <button
                onClick={() => setShowRightPanel(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0 8px'
                }}
              >
                ×
              </button>
            </div>
          )}
          <SpaceEditor
            appState={appState}
            onUpdateState={handleUpdateState}
          />
        </div>
      )}

      {/* Mobile bottom toolbar */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: '#fff',
          borderTop: '2px solid #ddd',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 20
        }}>
          <button
            onClick={() => {
              setShowLeftPanel(!showLeftPanel);
              setShowRightPanel(false);
            }}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              background: showLeftPanel ? '#e3f2fd' : 'transparent',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '20px' }}>🎨</span>
            <span>Objects</span>
          </button>
          <button
            onClick={() => {
              setShowRightPanel(!showRightPanel);
              setShowLeftPanel(false);
            }}
            style={{
              flex: 1,
              height: '100%',
              border: 'none',
              background: showRightPanel ? '#e3f2fd' : 'transparent',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '20px' }}>📐</span>
            <span>Space</span>
          </button>
        </div>
      )}
    </div>
  );
};
