/**
 * Main App component - state management and layout
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppState, SpaceObject, Point, PolygonEditState, Polygon, LibraryState, LibraryItem, SpaceLibraryItem, LibraryMode, ProjectsState, Project, Variation, ComparisonMode } from './types';
import { Canvas } from './Canvas';
import { SpaceEditor } from './SpaceEditor';
import { ObjectPalette } from './ObjectPalette';
import { PropertiesPanel } from './PropertiesPanel';
import { PolygonDesigner } from './PolygonDesigner';
import { LibraryPanel } from './LibraryPanel';
import { ProjectPanel } from './ProjectPanel';
import { ComparisonView } from './ComparisonView';
import { getPolygonCenter, isObjectInsideSpace, getPolygonBounds } from './geometry';
import { DEFAULT_LIBRARY_ITEMS, DEFAULT_SPACE_LIBRARY_ITEMS } from './libraryData';

const STORAGE_KEY = 'space-planner-projects-state';
const LEGACY_STORAGE_KEY = 'space-planner-state';
const LIBRARY_STORAGE_KEY = 'space-planner-library';

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

// Migrate old AppState to new ProjectsState format
const migrateOldState = (oldState: AppState): ProjectsState => {
  const now = new Date().toISOString();
  const variationId = `var-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const variation: Variation = {
    id: variationId,
    name: 'Original',
    createdAt: now,
    space: oldState.space,
    objects: oldState.objects
  };

  const project: Project = {
    id: projectId,
    name: 'My Space',
    createdAt: now,
    updatedAt: now,
    variations: [variation]
  };

  return {
    projects: [project],
    currentProjectId: projectId,
    currentVariationId: variationId,
    selectedObjectId: null
  };
};

// Load state from localStorage, fallback to default if not available or corrupted
const loadInitialState = (): ProjectsState => {
  try {
    // Try to load new format
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.projects && Array.isArray(parsed.projects)) {
        return parsed;
      }
    }

    // Try to migrate from old format
    const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyStored) {
      const parsed = JSON.parse(legacyStored);
      if (parsed && parsed.space && parsed.objects && Array.isArray(parsed.objects)) {
        console.log('Migrating from old format to projects structure');
        const migrated = migrateOldState(parsed);
        // Save migrated state
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        // Clear old storage
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return migrated;
      }
    }
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
  }

  // Return default as a project
  return migrateOldState(getDefaultState());
};

// Load library from localStorage, fallback to default library
const loadInitialLibrary = (): LibraryState => {
  try {
    const stored = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed) {
        return {
          items: DEFAULT_LIBRARY_ITEMS,
          customItems: parsed.customItems || [],
          spaceItems: DEFAULT_SPACE_LIBRARY_ITEMS,
          customSpaceItems: parsed.customSpaceItems || []
        };
      }
    }
  } catch (error) {
    console.warn('Failed to load library from localStorage:', error);
  }
  return {
    items: DEFAULT_LIBRARY_ITEMS,
    customItems: [],
    spaceItems: DEFAULT_SPACE_LIBRARY_ITEMS,
    customSpaceItems: []
  };
};

export const App: React.FC = () => {
  const [projectsState, setProjectsState] = useState<ProjectsState>(loadInitialState);
  const [libraryState, setLibraryState] = useState<LibraryState>(loadInitialLibrary);
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('objects');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [polygonEditState, setPolygonEditState] = useState<PolygonEditState | null>(null);
  const [resetViewFn, setResetViewFn] = useState<(() => void) | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>({
    active: false,
    leftVariationId: null,
    rightVariationId: null
  });

  // Save to localStorage whenever projectsState changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsState));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }, [projectsState]);

  // Save library to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify({
        customItems: libraryState.customItems,
        customSpaceItems: libraryState.customSpaceItems
      }));
    } catch (error) {
      console.error('Failed to save library to localStorage:', error);
    }
  }, [libraryState]);

  // Update mobile state on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get current project and variation
  const currentProject = projectsState.projects.find(p => p.id === projectsState.currentProjectId);
  const currentVariation = currentProject?.variations.find(v => v.id === projectsState.currentVariationId);

  // Get selected object
  const selectedObject = currentVariation?.objects.find(
    obj => obj.id === projectsState.selectedObjectId
  ) || null;

  // Get max z-index for new objects
  const maxZIndex = currentVariation?.objects.reduce(
    (max, obj) => Math.max(max, obj.zIndex),
    0
  ) || 0;

  // Get space center for placing new objects
  const spaceCenter = currentVariation ? getPolygonCenter(currentVariation.space.outline) : { x: 720, y: 600 };

  // Helper to update current variation
  const updateCurrentVariation = (updater: (variation: Variation) => Variation) => {
    if (!currentProject || !currentVariation) return;

    setProjectsState(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === currentProject.id
          ? {
              ...project,
              updatedAt: new Date().toISOString(),
              variations: project.variations.map(variation =>
                variation.id === currentVariation.id ? updater(variation) : variation
              )
            }
          : project
      )
    }));
  };

  // Handlers
  const handleSelectObject = (id: string | null) => {
    setProjectsState(prev => ({ ...prev, selectedObjectId: id }));
  };

  const handleUpdateObjectPosition = (id: string, position: Point) => {
    updateCurrentVariation(variation => ({
      ...variation,
      objects: variation.objects.map(obj =>
        obj.id === id ? { ...obj, position } : obj
      )
    }));
  };

  const handleUpdateObjectRotation = (id: string, rotation: number) => {
    if (!currentVariation) return;

    const obj = currentVariation.objects.find(o => o.id === id);
    if (!obj) return;

    // Check if the rotation would cause collision
    const testObject = { ...obj, rotation };
    if (!isObjectInsideSpace(testObject, currentVariation.space.outline)) {
      // Rotation would cause object to go through wall, reject it
      return;
    }

    updateCurrentVariation(variation => ({
      ...variation,
      objects: variation.objects.map(o =>
        o.id === id ? { ...o, rotation } : o
      )
    }));
  };

  const handleUpdateObjectName = (id: string, name: string) => {
    updateCurrentVariation(variation => ({
      ...variation,
      objects: variation.objects.map(obj =>
        obj.id === id ? { ...obj, name } : obj
      )
    }));
  };

  const handleUpdateObjectZIndex = (id: string, zIndex: number) => {
    updateCurrentVariation(variation => ({
      ...variation,
      objects: variation.objects.map(obj =>
        obj.id === id ? { ...obj, zIndex } : obj
      )
    }));
  };

  const handleAddObject = (obj: SpaceObject) => {
    updateCurrentVariation(variation => ({
      ...variation,
      objects: [...variation.objects, obj]
    }));
    setProjectsState(prev => ({ ...prev, selectedObjectId: obj.id }));
  };

  const handleDeleteObject = (id: string) => {
    updateCurrentVariation(variation => ({
      ...variation,
      objects: variation.objects.filter(obj => obj.id !== id)
    }));
    setProjectsState(prev => ({
      ...prev,
      selectedObjectId: prev.selectedObjectId === id ? null : prev.selectedObjectId
    }));
  };

  const handleDuplicateObject = (id: string) => {
    if (!currentVariation) return;

    const objectToDuplicate = currentVariation.objects.find(obj => obj.id === id);
    if (!objectToDuplicate) return;

    // Generate unique ID for the duplicate
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    const newId = `obj-${timestamp}-${random}`;

    // Generate a unique name by checking for existing copies
    const baseName = objectToDuplicate.name.replace(/ Copy(?: \d+)?$/, '');
    const copyPattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: Copy(?: (\\d+))?)?$`);
    const existingCopies = currentVariation.objects
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

    updateCurrentVariation(variation => ({
      ...variation,
      objects: [...variation.objects, duplicatedObject]
    }));
    setProjectsState(prev => ({ ...prev, selectedObjectId: newId }));
  };

  const handleUpdateState = (newState: AppState) => {
    updateCurrentVariation(variation => ({
      ...variation,
      space: newState.space,
      objects: newState.objects
    }));
  };

  const handleEnterPolygonEditMode = (target: 'space' | 'object', objectId?: string) => {
    if (target === 'object') {
      // Use selected object if no objectId provided
      const targetObjectId = objectId || projectsState.selectedObjectId;
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
    updateCurrentVariation(variation => ({
      ...variation,
      space: { outline }
    }));
  };

  const handleUpdateObjectShape = (id: string, shape: Polygon) => {
    updateCurrentVariation(variation => ({
      ...variation,
      objects: variation.objects.map(obj =>
        obj.id === id ? { ...obj, shape } : obj
      )
    }));
  };

  const handleMeasurementInput = (edgeIndex: number, targetLength: number) => {
    if (!polygonEditState || !currentVariation) return;

    const getPolygonPoints = (): Point[] | null => {
      if (polygonEditState.target.type === 'space') {
        return currentVariation.space.outline.points;
      } else {
        const obj = currentVariation.objects.find(o => o.id === (polygonEditState.target as { type: 'object'; objectId: string }).objectId);
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

  const handleSaveToLibrary = (name: string, category: string) => {
    if (!selectedObject) return;

    // Calculate dimensions from bounding box
    const bounds = getPolygonBounds(selectedObject.shape);
    const width = Math.round((bounds.maxX - bounds.minX) / 10);
    const height = Math.round((bounds.maxY - bounds.minY) / 10);

    const newLibraryItem: LibraryItem = {
      id: `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      shape: selectedObject.shape,
      category,
      width,
      height,
      description: `Custom saved from ${selectedObject.name}`
    };

    setLibraryState(prev => ({
      ...prev,
      customItems: [...prev.customItems, newLibraryItem]
    }));
  };

  const handleDeleteLibraryItem = (id: string) => {
    setLibraryState(prev => ({
      ...prev,
      customItems: prev.customItems.filter(item => item.id !== id)
    }));
  };

  const handleSaveSpaceToLibrary = (name: string, category: string) => {
    if (!currentVariation) return;

    const newSpaceLibraryItem: SpaceLibraryItem = {
      id: `space-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      space: { ...currentVariation.space },
      objects: currentVariation.objects.map(obj => ({ ...obj })),
      category,
      description: `Custom space with ${currentVariation.objects.length} object(s)`
    };

    setLibraryState(prev => ({
      ...prev,
      customSpaceItems: [...prev.customSpaceItems, newSpaceLibraryItem]
    }));
  };

  const handleDeleteSpaceLibraryItem = (id: string) => {
    setLibraryState(prev => ({
      ...prev,
      customSpaceItems: prev.customSpaceItems.filter(item => item.id !== id)
    }));
  };

  const handleLoadSpace = (spaceItem: SpaceLibraryItem) => {
    // Generate new IDs for all objects to avoid conflicts
    const newObjects = spaceItem.objects.map(obj => ({
      ...obj,
      id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${obj.id}`
    }));

    updateCurrentVariation(variation => ({
      ...variation,
      space: { ...spaceItem.space },
      objects: newObjects
    }));
  };

  // Project and variation management handlers
  const handleSelectProject = (projectId: string) => {
    const project = projectsState.projects.find(p => p.id === projectId);
    if (!project) return;

    setProjectsState(prev => ({
      ...prev,
      currentProjectId: projectId,
      currentVariationId: project.variations[0]?.id || null,
      selectedObjectId: null
    }));
  };

  const handleSelectVariation = (variationId: string) => {
    setProjectsState(prev => ({
      ...prev,
      currentVariationId: variationId,
      selectedObjectId: null
    }));
  };

  const handleCreateProject = (name: string) => {
    const now = new Date().toISOString();
    const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const variationId = `var-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const defaultState = getDefaultState();
    const variation: Variation = {
      id: variationId,
      name: 'Main',
      createdAt: now,
      space: defaultState.space,
      objects: defaultState.objects
    };

    const project: Project = {
      id: projectId,
      name,
      createdAt: now,
      updatedAt: now,
      variations: [variation]
    };

    setProjectsState(prev => ({
      ...prev,
      projects: [...prev.projects, project],
      currentProjectId: projectId,
      currentVariationId: variationId,
      selectedObjectId: null
    }));
  };

  const handleCreateVariation = (name: string) => {
    if (!currentProject || !currentVariation) return;

    const now = new Date().toISOString();
    const variationId = `var-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Clone current variation
    const newVariation: Variation = {
      id: variationId,
      name,
      createdAt: now,
      space: JSON.parse(JSON.stringify(currentVariation.space)),
      objects: JSON.parse(JSON.stringify(currentVariation.objects))
    };

    setProjectsState(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === currentProject.id
          ? {
              ...project,
              updatedAt: now,
              variations: [...project.variations, newVariation]
            }
          : project
      ),
      currentVariationId: variationId,
      selectedObjectId: null
    }));
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setProjectsState(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === projectId
          ? { ...project, name: newName, updatedAt: new Date().toISOString() }
          : project
      )
    }));
  };

  const handleRenameVariation = (variationId: string, newName: string) => {
    if (!currentProject) return;

    setProjectsState(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === currentProject.id
          ? {
              ...project,
              updatedAt: new Date().toISOString(),
              variations: project.variations.map(variation =>
                variation.id === variationId
                  ? { ...variation, name: newName }
                  : variation
              )
            }
          : project
      )
    }));
  };

  const handleDeleteProject = (projectId: string) => {
    const remainingProjects = projectsState.projects.filter(p => p.id !== projectId);
    if (remainingProjects.length === 0) return; // Don't delete last project

    const newCurrentProject = remainingProjects[0];
    setProjectsState({
      projects: remainingProjects,
      currentProjectId: newCurrentProject.id,
      currentVariationId: newCurrentProject.variations[0]?.id || null,
      selectedObjectId: null
    });
  };

  // Memoize the reset view ready callback to prevent unnecessary re-renders
  const handleResetViewReady = useCallback((resetFn: () => void) => {
    setResetViewFn(() => resetFn);
  }, []);

  const handleDeleteVariation = (variationId: string) => {
    if (!currentProject || currentProject.variations.length === 1) return; // Don't delete last variation

    const remainingVariations = currentProject.variations.filter(v => v.id !== variationId);
    const newCurrentVariation = remainingVariations[0];

    setProjectsState(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === currentProject.id
          ? {
              ...project,
              updatedAt: new Date().toISOString(),
              variations: remainingVariations
            }
          : project
      ),
      currentVariationId: newCurrentVariation.id,
      selectedObjectId: null
    }));
  };

  // Comparison mode handlers
  const handleEnterComparisonMode = (leftVariationId: string, rightVariationId: string) => {
    setComparisonMode({
      active: true,
      leftVariationId,
      rightVariationId
    });
    setProjectsState(prev => ({ ...prev, selectedObjectId: null }));
  };

  const handleExitComparisonMode = () => {
    setComparisonMode({
      active: false,
      leftVariationId: null,
      rightVariationId: null
    });
  };

  // Get variations for comparison mode
  const leftComparison = currentProject?.variations.find(v => v.id === comparisonMode.leftVariationId);
  const rightComparison = currentProject?.variations.find(v => v.id === comparisonMode.rightVariationId);

  // If in comparison mode and we have both variations, render comparison view
  if (comparisonMode.active && leftComparison && rightComparison) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <ProjectPanel
          projects={projectsState.projects}
          currentProjectId={projectsState.currentProjectId}
          currentVariationId={projectsState.currentVariationId}
          onSelectProject={handleSelectProject}
          onSelectVariation={handleSelectVariation}
          onCreateProject={handleCreateProject}
          onCreateVariation={handleCreateVariation}
          onRenameProject={handleRenameProject}
          onRenameVariation={handleRenameVariation}
          onDeleteProject={handleDeleteProject}
          onDeleteVariation={handleDeleteVariation}
          onEnterComparisonMode={handleEnterComparisonMode}
          comparisonActive={comparisonMode.active}
        />
        <ComparisonView
          leftVariation={leftComparison}
          rightVariation={rightComparison}
          onExitComparison={handleExitComparisonMode}
        />
      </div>
    );
  }

  // Regular editing view
  if (!currentProject || !currentVariation) {
    return <div style={{ padding: '20px' }}>No project selected. Please create a project.</div>;
  }

  // Create appState for compatibility with existing components
  const appState: AppState = {
    space: currentVariation.space,
    objects: currentVariation.objects,
    selectedObjectId: projectsState.selectedObjectId
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Project panel */}
      <ProjectPanel
        projects={projectsState.projects}
        currentProjectId={projectsState.currentProjectId}
        currentVariationId={projectsState.currentVariationId}
        onSelectProject={handleSelectProject}
        onSelectVariation={handleSelectVariation}
        onCreateProject={handleCreateProject}
        onCreateVariation={handleCreateVariation}
        onRenameProject={handleRenameProject}
        onRenameVariation={handleRenameVariation}
        onDeleteProject={handleDeleteProject}
        onDeleteVariation={handleDeleteVariation}
        onEnterComparisonMode={handleEnterComparisonMode}
        comparisonActive={comparisonMode.active}
      />

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
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
          <div style={{ flex: 1, overflow: 'auto' }}>
            <LibraryPanel
              libraryItems={libraryState.items}
              customItems={libraryState.customItems}
              spaceLibraryItems={libraryState.spaceItems}
              customSpaceItems={libraryState.customSpaceItems}
              libraryMode={libraryMode}
              onLibraryModeChange={setLibraryMode}
              spaceCenter={spaceCenter}
              maxZIndex={maxZIndex}
              selectedObject={selectedObject}
              onAddObject={handleAddObject}
              onSaveToLibrary={handleSaveToLibrary}
              onDeleteLibraryItem={handleDeleteLibraryItem}
              onSaveSpaceToLibrary={handleSaveSpaceToLibrary}
              onDeleteSpaceLibraryItem={handleDeleteSpaceLibraryItem}
              onLoadSpace={handleLoadSpace}
            />
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
            onResetViewReady={handleResetViewReady}
            showLabels={showLabels}
          />
          {(!isMobile || (!showLeftPanel && !showRightPanel)) && (
            <PolygonDesigner
              editState={polygonEditState}
              onEnterEditMode={handleEnterPolygonEditMode}
              onExitEditMode={handleExitPolygonEditMode}
              onMeasurementInput={handleMeasurementInput}
              onResetView={resetViewFn}
              currentPolygonPoints={
                polygonEditState
                  ? polygonEditState.target.type === 'space'
                    ? appState.space.outline.points
                    : appState.objects.find(o => o.id === (polygonEditState.target as { type: 'object'; objectId: string }).objectId)?.shape.points || []
                  : []
              }
              showLabels={showLabels}
              onToggleLabels={() => setShowLabels(!showLabels)}
            />
          )}
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
    </div>
  );
};
