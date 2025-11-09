/**
 * PropertiesPanel component - Edit properties of selected object
 */

import React, { useState, useEffect } from 'react';
import { SpaceObject, Point } from './types';

interface PropertiesPanelProps {
  selectedObject: SpaceObject | null;
  onUpdateName: (id: string, name: string) => void;
  onUpdatePosition: (id: string, position: Point) => void;
  onUpdateRotation: (id: string, rotation: number) => void;
  onUpdateZIndex: (id: string, zIndex: number) => void;
  onDeleteObject: (id: string) => void;
  onDuplicateObject: (id: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedObject,
  onUpdateName,
  onUpdatePosition,
  onUpdateRotation,
  onUpdateZIndex,
  onDeleteObject,
  onDuplicateObject
}) => {
  const [name, setName] = useState('');
  const [posX, setPosX] = useState('');
  const [posY, setPosY] = useState('');
  const [rotation, setRotation] = useState('');
  const [zIndex, setZIndex] = useState('');

  // Update form when selected object changes
  useEffect(() => {
    if (selectedObject) {
      setName(selectedObject.name);
      setPosX((selectedObject.position.x / 10).toFixed(1));
      setPosY((selectedObject.position.y / 10).toFixed(1));
      setRotation(selectedObject.rotation.toFixed(1));
      setZIndex(selectedObject.zIndex.toString());
    }
  }, [selectedObject]);

  if (!selectedObject) {
    return (
      <div
        style={{
          padding: '10px',
          backgroundColor: '#f9f9f9',
          borderTop: '1px solid #ddd',
          color: '#999',
          fontSize: '12px'
        }}
      >
        No object selected
      </div>
    );
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    onUpdateName(selectedObject.id, newName);
  };

  const handlePosXBlur = () => {
    const value = parseFloat(posX);
    if (!isNaN(value)) {
      onUpdatePosition(selectedObject.id, {
        x: Math.round(value * 10),
        y: selectedObject.position.y
      });
    } else {
      setPosX((selectedObject.position.x / 10).toFixed(1));
    }
  };

  const handlePosYBlur = () => {
    const value = parseFloat(posY);
    if (!isNaN(value)) {
      onUpdatePosition(selectedObject.id, {
        x: selectedObject.position.x,
        y: Math.round(value * 10)
      });
    } else {
      setPosY((selectedObject.position.y / 10).toFixed(1));
    }
  };

  const handleRotationBlur = () => {
    const value = parseFloat(rotation);
    if (!isNaN(value)) {
      onUpdateRotation(selectedObject.id, (value + 360) % 360);
    } else {
      setRotation(selectedObject.rotation.toFixed(1));
    }
  };

  const handleZIndexBlur = () => {
    const value = parseInt(zIndex, 10);
    if (!isNaN(value) && value >= 0) {
      onUpdateZIndex(selectedObject.id, value);
    } else {
      setZIndex(selectedObject.zIndex.toString());
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${selectedObject.name}"?`)) {
      onDeleteObject(selectedObject.id);
    }
  };

  const handleDuplicate = () => {
    onDuplicateObject(selectedObject.id);
  };

  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#fff',
        borderTop: '1px solid #ddd'
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Properties</h3>

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            marginBottom: '4px',
            fontWeight: 'bold'
          }}
        >
          Name:
        </label>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          style={{
            width: '100%',
            padding: '6px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            marginBottom: '4px',
            fontWeight: 'bold'
          }}
        >
          Position X (inches):
        </label>
        <input
          type="number"
          value={posX}
          onChange={(e) => setPosX(e.target.value)}
          onBlur={handlePosXBlur}
          step="0.1"
          style={{
            width: '100%',
            padding: '6px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            marginBottom: '4px',
            fontWeight: 'bold'
          }}
        >
          Position Y (inches):
        </label>
        <input
          type="number"
          value={posY}
          onChange={(e) => setPosY(e.target.value)}
          onBlur={handlePosYBlur}
          step="0.1"
          style={{
            width: '100%',
            padding: '6px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            marginBottom: '4px',
            fontWeight: 'bold'
          }}
        >
          Rotation (degrees):
        </label>
        <input
          type="number"
          value={rotation}
          onChange={(e) => setRotation(e.target.value)}
          onBlur={handleRotationBlur}
          step="1"
          min="0"
          max="360"
          style={{
            width: '100%',
            padding: '6px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            marginBottom: '4px',
            fontWeight: 'bold'
          }}
        >
          Z-Index (layer):
        </label>
        <input
          type="number"
          value={zIndex}
          onChange={(e) => setZIndex(e.target.value)}
          onBlur={handleZIndexBlur}
          step="1"
          min="0"
          style={{
            width: '100%',
            padding: '6px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <button
        onClick={handleDuplicate}
        style={{
          width: '100%',
          padding: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#fff',
          backgroundColor: '#4CAF50',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '8px'
        }}
      >
        Duplicate Object
      </button>

      <button
        onClick={handleDelete}
        style={{
          width: '100%',
          padding: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#fff',
          backgroundColor: '#ff4444',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Delete Object
      </button>
    </div>
  );
};
