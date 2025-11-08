/**
 * Main App component - state management and layout
 */

import React, { useState } from 'react';
import { AppState, SpaceObject, Point } from './types';
import { Canvas } from './Canvas';
import { SpaceEditor } from './SpaceEditor';
import { ObjectPalette } from './ObjectPalette';
import { PropertiesPanel } from './PropertiesPanel';
import { getPolygonCenter } from './geometry';

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
    setAppState(prev => ({
      ...prev,
      objects: prev.objects.map(obj =>
        obj.id === id ? { ...obj, rotation } : obj
      )
    }));
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Left sidebar */}
      <div
        style={{
          width: '300px',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #ddd',
          backgroundColor: '#f9f9f9'
        }}
      >
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

      {/* Canvas area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
            Click to select • Drag to move • Drag handle to rotate • Scroll to zoom
          </p>
        </div>
        <div style={{ flex: 1 }}>
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

      {/* Right sidebar */}
      <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
        <SpaceEditor
          appState={appState}
          onUpdateState={handleUpdateState}
        />
      </div>
    </div>
  );
};
