/**
 * ObjectPalette component - UI for adding new rectangular objects
 */

import React, { useState } from 'react';
import { SpaceObject } from './types';
import { createRectangle } from './geometry';

interface ObjectPaletteProps {
  spaceCenter: { x: number; y: number };
  maxZIndex: number;
  onAddObject: (obj: SpaceObject) => void;
}

export const ObjectPalette: React.FC<ObjectPaletteProps> = ({
  spaceCenter,
  maxZIndex,
  onAddObject
}) => {
  const [name, setName] = useState('');
  const [width, setWidth] = useState('36');
  const [height, setHeight] = useState('18');

  const handleAddRectangle = () => {
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);

    if (isNaN(widthNum) || isNaN(heightNum) || widthNum <= 0 || heightNum <= 0) {
      alert('Please enter valid positive numbers for width and height');
      return;
    }

    const objectName = name.trim() || `Object ${maxZIndex + 1}`;

    const newObject: SpaceObject = {
      id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: objectName,
      shape: createRectangle(widthNum, heightNum),
      position: {
        x: Math.round(spaceCenter.x),
        y: Math.round(spaceCenter.y)
      },
      rotation: 0,
      zIndex: maxZIndex + 1
    };

    onAddObject(newObject);

    // Reset form
    setName('');
  };

  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #ddd'
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Add Rectangle</h3>

      <div style={{ marginBottom: '10px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            marginBottom: '4px',
            fontWeight: 'bold'
          }}
        >
          Name (optional):
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Sofa, Table"
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
          Width (inches):
        </label>
        <input
          type="number"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          min="1"
          step="1"
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
          Height (inches):
        </label>
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          min="1"
          step="1"
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
        onClick={handleAddRectangle}
        style={{
          width: '100%',
          padding: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#fff',
          backgroundColor: '#4080ff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Add Rectangle
      </button>

      <div
        style={{
          marginTop: '10px',
          fontSize: '11px',
          color: '#666',
          lineHeight: '1.4'
        }}
      >
        <strong>Common sizes:</strong>
        <br />
        Sofa: 72-96" × 30-40"
        <br />
        Coffee Table: 48" × 24"
        <br />
        Dining Table: 48-60" × 30"
      </div>
    </div>
  );
};
