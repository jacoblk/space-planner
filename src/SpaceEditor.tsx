/**
 * SpaceEditor component - JSON editor with live validation
 */

import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import { parseAppState, serializeAppState } from './validation';

interface SpaceEditorProps {
  appState: AppState;
  onUpdateState: (state: AppState) => void;
}

export const SpaceEditor: React.FC<SpaceEditorProps> = ({
  appState,
  onUpdateState
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize and update JSON text when app state changes externally
  useEffect(() => {
    setJsonText(serializeAppState(appState));
  }, [appState]);

  // Handle JSON text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setJsonText(text);

    // Validate and update state
    const result = parseAppState(text);
    if (result.valid) {
      setError(null);
      onUpdateState(result.data);
    } else {
      setError(result.error);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '10px',
        backgroundColor: '#fff',
        borderLeft: '1px solid #ddd'
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Space Configuration</h3>

      <textarea
        value={jsonText}
        onChange={handleChange}
        style={{
          flex: 1,
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '10px',
          border: `1px solid ${error ? '#ff4444' : '#ddd'}`,
          borderRadius: '4px',
          resize: 'none',
          outline: 'none'
        }}
        spellCheck={false}
      />

      {error && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#fff0f0',
            border: '1px solid #ff4444',
            borderRadius: '4px',
            color: '#c00',
            fontSize: '12px'
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <div
        style={{
          marginTop: '10px',
          fontSize: '11px',
          color: '#666',
          lineHeight: '1.4'
        }}
      >
        <strong>Units:</strong> All coordinates in tenths of inches
        <br />
        <strong>Example:</strong> 720 = 72.0" = 6'
      </div>
    </div>
  );
};
