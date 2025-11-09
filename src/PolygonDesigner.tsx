/**
 * PolygonDesigner component - UI controls for polygon editing mode
 */

import React from 'react';
import { PolygonEditState, Point } from './types';

interface PolygonDesignerProps {
  editState: PolygonEditState | null;
  onEnterEditMode: (target: 'space' | 'object', objectId?: string) => void;
  onExitEditMode: () => void;
  onMeasurementInput: (edgeIndex: number, value: number) => void;
  currentPolygonPoints: Point[];
}

export const PolygonDesigner: React.FC<PolygonDesignerProps> = ({
  editState,
  onEnterEditMode,
  onExitEditMode,
  onMeasurementInput,
  currentPolygonPoints
}) => {
  const [measurementValue, setMeasurementValue] = React.useState<string>('');

  const handleMeasurementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editState?.measurementEdgeIndex !== null && editState?.measurementEdgeIndex !== undefined) {
      const value = parseFloat(measurementValue);
      if (!isNaN(value) && value > 0) {
        onMeasurementInput(editState.measurementEdgeIndex, value * 10); // Convert to tenths of inches
        setMeasurementValue('');
      }
    }
  };

  const calculateEdgeLength = (index: number): number => {
    if (!currentPolygonPoints || currentPolygonPoints.length < 2) return 0;
    const p1 = currentPolygonPoints[index];
    const p2 = currentPolygonPoints[(index + 1) % currentPolygonPoints.length];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy) / 10; // Convert to inches
  };

  if (!editState) {
    return (
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
          Polygon Designer
        </h3>
        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>
          Select what to edit:
        </p>
        <button
          onClick={() => onEnterEditMode('space')}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 12px',
            marginBottom: '8px',
            backgroundColor: '#4080ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Edit Space Outline
        </button>
        <button
          onClick={() => onEnterEditMode('object')}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px 12px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Edit Selected Object
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 1000,
      minWidth: '250px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          Editing {editState.target.type === 'space' ? 'Space' : 'Object'}
        </h3>
        <button
          onClick={onExitEditMode}
          style={{
            padding: '4px 8px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Exit
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
        <p style={{ margin: '0 0 5px 0' }}>
          <strong>Drag vertices</strong> to adjust shape
        </p>
        <p style={{ margin: '0 0 5px 0' }}>
          <strong>Click edges</strong> to add vertices
        </p>
        <p style={{ margin: '0' }}>
          <strong>Click edge + Enter length</strong> to set measurement
        </p>
      </div>

      {editState.measurementEdgeIndex !== null && (
        <form onSubmit={handleMeasurementSubmit} style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
              Edge {editState.measurementEdgeIndex + 1} Length (inches):
            </label>
            <input
              type="number"
              step="0.1"
              value={measurementValue}
              onChange={(e) => setMeasurementValue(e.target.value)}
              placeholder={calculateEdgeLength(editState.measurementEdgeIndex).toFixed(1)}
              autoFocus
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Apply Length
          </button>
        </form>
      )}

      {currentPolygonPoints && currentPolygonPoints.length > 0 && (
        <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
          <strong>Vertices:</strong> {currentPolygonPoints.length}
        </div>
      )}
    </div>
  );
};
