/**
 * Comparison view - displays two variations side-by-side in read-only mode
 */

import React from 'react';
import { Canvas } from './Canvas';
import { Variation } from './types';

type ComparisonViewProps = {
  leftVariation: Variation;
  rightVariation: Variation;
  onExitComparison: () => void;
};

export function ComparisonView({
  leftVariation,
  rightVariation,
  onExitComparison
}: ComparisonViewProps) {
  // No-op handlers for read-only mode
  const noopSelectObject = () => {};
  const noopUpdatePosition = () => {};
  const noopUpdateRotation = () => {};
  const noopUpdatePolygonEditState = () => {};
  const noopUpdateSpaceOutline = () => {};
  const noopUpdateObjectShape = () => {};

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#fff'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#e8f4f8',
        borderBottom: '2px solid #007bff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
          Comparison Mode (View Only)
        </h2>
        <button
          onClick={onExitComparison}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Exit Comparison
        </button>
      </div>

      {/* Comparison panels */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '2px solid #007bff',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #dee2e6',
            fontWeight: 600,
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {leftVariation.name}
          </div>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <Canvas
              space={leftVariation.space}
              objects={leftVariation.objects}
              selectedObjectId={null}
              onSelectObject={noopSelectObject}
              onUpdateObjectPosition={noopUpdatePosition}
              onUpdateObjectRotation={noopUpdateRotation}
              polygonEditState={null}
              onUpdatePolygonEditState={noopUpdatePolygonEditState}
              onUpdateSpaceOutline={noopUpdateSpaceOutline}
              onUpdateObjectShape={noopUpdateObjectShape}
              showLabels={true}
            />
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #dee2e6',
            fontWeight: 600,
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {rightVariation.name}
          </div>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <Canvas
              space={rightVariation.space}
              objects={rightVariation.objects}
              selectedObjectId={null}
              onSelectObject={noopSelectObject}
              onUpdateObjectPosition={noopUpdatePosition}
              onUpdateObjectRotation={noopUpdateRotation}
              polygonEditState={null}
              onUpdatePolygonEditState={noopUpdatePolygonEditState}
              onUpdateSpaceOutline={noopUpdateSpaceOutline}
              onUpdateObjectShape={noopUpdateObjectShape}
              showLabels={true}
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: '#fff3cd',
        borderTop: '1px solid #ffc107',
        fontSize: '13px',
        textAlign: 'center',
        color: '#856404'
      }}>
        You can pan and zoom in each view independently. Click "Exit Comparison" to return to editing mode.
      </div>
    </div>
  );
}
