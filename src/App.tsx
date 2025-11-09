/**
 * Main App component - state management and layout
 */

import React, { useState } from 'react';
import { AppState, SpaceObject, Point } from './types';
import { Canvas } from './Canvas';
import { SpaceEditor } from './SpaceEditor';
import { ObjectPalette } from './ObjectPalette';
import { PropertiesPanel } from './PropertiesPanel';
import { getPolygonCenter, isObjectInsideSpace } from './geometry';

// Initial state with a 12' × 10' room and a 6' × 3' sofa
const initialState: AppState = {
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
};

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(initialState);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Update mobile state on resize
  React.useEffect(() => {
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

  const handleUpdateState = (newState: AppState) => {
    setAppState(newState);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative'
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
        <div style={{ flex: 1, marginBottom: isMobile ? '60px' : 0 }}>
          <Canvas
            space={appState.space}
            objects={appState.objects}
            selectedObjectId={appState.selectedObjectId}
            onSelectObject={handleSelectObject}
            onUpdateObjectPosition={handleUpdateObjectPosition}
            onUpdateObjectRotation={handleUpdateObjectRotation}
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
