/**
 * Project and variation management panel
 */

import React, { useState } from 'react';
import { Project, Variation } from './types';

type ProjectPanelProps = {
  projects: Project[];
  currentProjectId: string | null;
  currentVariationId: string | null;
  onSelectProject: (projectId: string) => void;
  onSelectVariation: (variationId: string) => void;
  onCreateProject: (name: string) => void;
  onCreateVariation: (name: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onRenameVariation: (variationId: string, newName: string) => void;
  onDeleteProject: (projectId: string) => void;
  onDeleteVariation: (variationId: string) => void;
  onEnterComparisonMode: (leftVariationId: string, rightVariationId: string) => void;
  comparisonActive: boolean;
};

export function ProjectPanel({
  projects,
  currentProjectId,
  currentVariationId,
  onSelectProject,
  onSelectVariation,
  onCreateProject,
  onCreateVariation,
  onRenameProject,
  onRenameVariation,
  onDeleteProject,
  onDeleteVariation,
  onEnterComparisonMode,
  comparisonActive
}: ProjectPanelProps) {
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [showNewVariationInput, setShowNewVariationInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newVariationName, setNewVariationName] = useState('');
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [leftVariation, setLeftVariation] = useState('');
  const [rightVariation, setRightVariation] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingVariationId, setEditingVariationId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const currentProject = projects.find(p => p.id === currentProjectId);
  const currentVariation = currentProject?.variations.find(v => v.id === currentVariationId);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProjectInput(false);
    }
  };

  const handleCreateVariation = () => {
    if (newVariationName.trim()) {
      onCreateVariation(newVariationName.trim());
      setNewVariationName('');
      setShowNewVariationInput(false);
    }
  };

  const handleStartComparison = () => {
    if (leftVariation && rightVariation && leftVariation !== rightVariation) {
      onEnterComparisonMode(leftVariation, rightVariation);
      setShowComparisonModal(false);
      setLeftVariation('');
      setRightVariation('');
    }
  };

  const handleStartRenameProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
  };

  const handleStartRenameVariation = (variation: Variation) => {
    setEditingVariationId(variation.id);
    setEditingName(variation.name);
  };

  const handleSaveRenameProject = () => {
    if (editingProjectId && editingName.trim()) {
      onRenameProject(editingProjectId, editingName.trim());
      setEditingProjectId(null);
      setEditingName('');
    }
  };

  const handleSaveRenameVariation = () => {
    if (editingVariationId && editingName.trim()) {
      onRenameVariation(editingVariationId, editingName.trim());
      setEditingVariationId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditingVariationId(null);
    setEditingName('');
  };

  return (
    <div style={{
      padding: '12px 20px',
      backgroundColor: '#f5f5f5',
      borderBottom: '1px solid #ddd',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap'
    }}>
      {/* Project selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontWeight: 600, fontSize: '14px' }}>Project:</label>
        {editingProjectId && currentProjectId === editingProjectId ? (
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRenameProject();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              style={{ padding: '4px 8px', fontSize: '13px', width: '150px' }}
              autoFocus
            />
            <button onClick={handleSaveRenameProject} style={{ padding: '4px 8px', fontSize: '12px' }}>✓</button>
            <button onClick={handleCancelEdit} style={{ padding: '4px 8px', fontSize: '12px' }}>✕</button>
          </div>
        ) : (
          <>
            <select
              value={currentProjectId || ''}
              onChange={(e) => onSelectProject(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '13px', minWidth: '150px' }}
              disabled={comparisonActive}
            >
              <option value="">Select project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {currentProject && (
              <>
                <button
                  onClick={() => handleStartRenameProject(currentProject)}
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  disabled={comparisonActive}
                  title="Rename project"
                >
                  ✎
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete project "${currentProject.name}"?`)) {
                      onDeleteProject(currentProject.id);
                    }
                  }}
                  style={{ padding: '4px 8px', fontSize: '12px', color: '#dc3545' }}
                  disabled={comparisonActive || projects.length === 1}
                  title="Delete project"
                >
                  🗑
                </button>
              </>
            )}
          </>
        )}
        {!showNewProjectInput && !editingProjectId ? (
          <button
            onClick={() => setShowNewProjectInput(true)}
            style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            disabled={comparisonActive}
          >
            + New Project
          </button>
        ) : showNewProjectInput && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') { setShowNewProjectInput(false); setNewProjectName(''); }
              }}
              style={{ padding: '4px 8px', fontSize: '13px', width: '150px' }}
              autoFocus
            />
            <button onClick={handleCreateProject} style={{ padding: '4px 8px', fontSize: '12px' }}>Create</button>
            <button onClick={() => { setShowNewProjectInput(false); setNewProjectName(''); }} style={{ padding: '4px 8px', fontSize: '12px' }}>Cancel</button>
          </div>
        )}
      </div>

      {/* Variation selector */}
      {currentProject && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontWeight: 600, fontSize: '14px' }}>Variation:</label>
          {editingVariationId && currentVariationId === editingVariationId ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRenameVariation();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                style={{ padding: '4px 8px', fontSize: '13px', width: '150px' }}
                autoFocus
              />
              <button onClick={handleSaveRenameVariation} style={{ padding: '4px 8px', fontSize: '12px' }}>✓</button>
              <button onClick={handleCancelEdit} style={{ padding: '4px 8px', fontSize: '12px' }}>✕</button>
            </div>
          ) : (
            <>
              <select
                value={currentVariationId || ''}
                onChange={(e) => onSelectVariation(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '13px', minWidth: '150px' }}
                disabled={comparisonActive}
              >
                <option value="">Select variation...</option>
                {currentProject.variations.map(variation => (
                  <option key={variation.id} value={variation.id}>
                    {variation.name}
                  </option>
                ))}
              </select>
              {currentVariation && (
                <>
                  <button
                    onClick={() => handleStartRenameVariation(currentVariation)}
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                    disabled={comparisonActive}
                    title="Rename variation"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete variation "${currentVariation.name}"?`)) {
                        onDeleteVariation(currentVariation.id);
                      }
                    }}
                    style={{ padding: '4px 8px', fontSize: '12px', color: '#dc3545' }}
                    disabled={comparisonActive || currentProject.variations.length === 1}
                    title="Delete variation"
                  >
                    🗑
                  </button>
                </>
              )}
            </>
          )}
          {!showNewVariationInput && !editingVariationId ? (
            <button
              onClick={() => setShowNewVariationInput(true)}
              style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              disabled={comparisonActive}
            >
              + New Variation
            </button>
          ) : showNewVariationInput && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                placeholder="Variation name"
                value={newVariationName}
                onChange={(e) => setNewVariationName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateVariation();
                  if (e.key === 'Escape') { setShowNewVariationInput(false); setNewVariationName(''); }
                }}
                style={{ padding: '4px 8px', fontSize: '13px', width: '150px' }}
                autoFocus
              />
              <button onClick={handleCreateVariation} style={{ padding: '4px 8px', fontSize: '12px' }}>Create</button>
              <button onClick={() => { setShowNewVariationInput(false); setNewVariationName(''); }} style={{ padding: '4px 8px', fontSize: '12px' }}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* Comparison mode */}
      {currentProject && currentProject.variations.length >= 2 && (
        <button
          onClick={() => setShowComparisonModal(true)}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
          disabled={comparisonActive}
        >
          Compare Variations
        </button>
      )}

      {/* Comparison modal */}
      {showComparisonModal && currentProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '400px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginTop: 0 }}>Compare Variations</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Left side:</label>
              <select
                value={leftVariation}
                onChange={(e) => setLeftVariation(e.target.value)}
                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
              >
                <option value="">Select variation...</option>
                {currentProject.variations.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Right side:</label>
              <select
                value={rightVariation}
                onChange={(e) => setRightVariation(e.target.value)}
                style={{ width: '100%', padding: '8px', fontSize: '14px' }}
              >
                <option value="">Select variation...</option>
                {currentProject.variations.map(v => (
                  <option key={v.id} value={v.id} disabled={v.id === leftVariation}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowComparisonModal(false);
                  setLeftVariation('');
                  setRightVariation('');
                }}
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleStartComparison}
                disabled={!leftVariation || !rightVariation || leftVariation === rightVariation}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: leftVariation && rightVariation && leftVariation !== rightVariation ? 'pointer' : 'not-allowed',
                  opacity: leftVariation && rightVariation && leftVariation !== rightVariation ? 1 : 0.5
                }}
              >
                Compare
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
