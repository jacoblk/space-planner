/**
 * LibraryPanel component - UI for browsing and adding library items
 */

import React, { useState } from 'react';
import { SpaceObject, LibraryItem } from './types';

interface LibraryPanelProps {
  libraryItems: LibraryItem[];
  customItems: LibraryItem[];
  spaceCenter: { x: number; y: number };
  maxZIndex: number;
  selectedObject: SpaceObject | null;
  onAddObject: (obj: SpaceObject) => void;
  onSaveToLibrary: (name: string, category: string) => void;
  onDeleteLibraryItem: (id: string) => void;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({
  libraryItems,
  customItems,
  spaceCenter,
  maxZIndex,
  selectedObject,
  onAddObject,
  onSaveToLibrary,
  onDeleteLibraryItem
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveCategory, setSaveCategory] = useState('Custom');

  // Combine all items
  const allItems = [...libraryItems, ...customItems];

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(allItems.map(item => item.category))).sort()];

  // Filter items
  const filteredItems = allItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddLibraryItem = (item: LibraryItem) => {
    const newObject: SpaceObject = {
      id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name,
      shape: item.shape,
      position: {
        x: Math.round(spaceCenter.x),
        y: Math.round(spaceCenter.y)
      },
      rotation: 0,
      zIndex: maxZIndex + 1
    };

    onAddObject(newObject);
  };

  const handleSaveToLibrary = () => {
    if (!selectedObject) return;

    const name = saveName.trim() || selectedObject.name;
    onSaveToLibrary(name, saveCategory);

    // Reset form
    setSaveName('');
    setShowSaveForm(false);
  };

  return (
    <div
      style={{
        padding: '10px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #ddd',
        maxHeight: '100%',
        overflow: 'auto'
      }}
    >
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Object Library</h3>

      {/* Search */}
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search library..."
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

      {/* Category tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          marginBottom: '10px'
        }}
      >
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              backgroundColor: selectedCategory === category ? '#4080ff' : '#f0f0f0',
              color: selectedCategory === category ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: selectedCategory === category ? 'bold' : 'normal'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Library items grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '8px',
          marginBottom: '10px'
        }}
      >
        {filteredItems.map(item => {
          const isCustom = customItems.some(ci => ci.id === item.id);
          return (
            <div
              key={item.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '8px',
                cursor: 'pointer',
                backgroundColor: '#fafafa',
                position: 'relative',
                transition: 'background-color 0.2s'
              }}
              onClick={() => handleAddLibraryItem(item)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fafafa';
              }}
            >
              {isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLibraryItem(item.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '16px',
                    height: '16px',
                    padding: '0',
                    fontSize: '10px',
                    backgroundColor: '#ff4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Delete"
                >
                  ×
                </button>
              )}
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={item.name}
              >
                {item.name}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#666'
                }}
              >
                {item.width}" × {item.height}"
              </div>
              {item.description && (
                <div
                  style={{
                    fontSize: '9px',
                    color: '#999',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={item.description}
                >
                  {item.description}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            color: '#999',
            fontSize: '12px'
          }}
        >
          No items found
        </div>
      )}

      {/* Save to library section */}
      <div
        style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
          border: '1px solid #e0e0e0'
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '6px'
          }}
        >
          Save to Library
        </div>

        {!showSaveForm ? (
          <button
            onClick={() => setShowSaveForm(true)}
            disabled={!selectedObject}
            style={{
              width: '100%',
              padding: '6px',
              fontSize: '12px',
              backgroundColor: selectedObject ? '#4080ff' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedObject ? 'pointer' : 'not-allowed'
            }}
          >
            {selectedObject ? 'Save Selected Object' : 'Select an object first'}
          </button>
        ) : (
          <div>
            <div style={{ marginBottom: '6px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  marginBottom: '2px',
                  fontWeight: 'bold'
                }}
              >
                Name:
              </label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={selectedObject?.name || 'Object name'}
                style={{
                  width: '100%',
                  padding: '4px',
                  fontSize: '11px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '6px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  marginBottom: '2px',
                  fontWeight: 'bold'
                }}
              >
                Category:
              </label>
              <input
                type="text"
                value={saveCategory}
                onChange={(e) => setSaveCategory(e.target.value)}
                placeholder="e.g., Custom, Furniture"
                style={{
                  width: '100%',
                  padding: '4px',
                  fontSize: '11px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={handleSaveToLibrary}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '11px',
                  backgroundColor: '#4080ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveForm(false);
                  setSaveName('');
                }}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '11px',
                  backgroundColor: '#ccc',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
