# Space Planner - Architecture Documentation

## Overview

This document provides technical details about the Space Planner application architecture, implementation decisions, and internal workings.

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────┐
│                    App Component                        │
│  - State management (AppState)                          │
│  - Event handlers                                       │
│  - Component coordination                               │
└────────────┬────────────────────────┬───────────────────┘
             │                        │
    ┌────────┴────────┐      ┌────────┴────────┐
    │   Left Panel    │      │   Right Panel   │
    │  - ObjectPalette│      │  - SpaceEditor  │
    │  - Properties   │      │                 │
    └────────┬────────┘      └─────────────────┘
             │
    ┌────────┴─────────────────────────────────┐
    │         Canvas Component                 │
    │  - Rendering                             │
    │  - Mouse interactions                    │
    │  - Viewport management                   │
    └──────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │  Utility Modules│
    │  - geometry.ts  │
    │  - validation.ts│
    │  - types.ts     │
    └─────────────────┘
```

## Data Flow

### State Management

The application uses React's `useState` hook for state management with a centralized state in the `App` component.

```typescript
type AppState = {
  space: Space;              // Room definition
  objects: SpaceObject[];    // All furniture objects
  selectedObjectId: string | null;  // Currently selected object
};
```

**State Updates:**
- Immutable updates using spread operators
- One-way data flow (top-down)
- Event handlers in App component update state
- Props flow down to child components

### Component Communication

```
User Action
    ↓
Canvas/Panel Component (captures event)
    ↓
Event Handler (App component)
    ↓
State Update (immutable)
    ↓
React Re-render
    ↓
Updated UI
```

## Core Modules

### 1. Types Module (`types.ts`)

Defines all TypeScript interfaces and types:

- **Point**: `{x: number, y: number}` - coordinates in tenths of inches
- **Polygon**: Array of points forming a closed shape
- **SpaceObject**: Furniture with shape, position, rotation, z-index
- **Space**: Room boundary as a polygon
- **Viewport**: Pan/zoom state for canvas rendering
- **InteractionMode**: Current mouse interaction state

### 2. Geometry Module (`geometry.ts`)

Mathematical utilities for coordinate transforms and hit detection:

#### Coordinate Transforms

```typescript
worldToScreen(point: Point, viewport: Viewport): ScreenPoint
screenToWorld(x: number, y: number, viewport: Viewport): Point
```

**Transform Pipeline:**
1. World coordinates (tenths of inches)
2. Apply pan offset
3. Apply zoom scale
4. Convert to screen pixels

#### Hit Detection

```typescript
isPointInPolygon(point: Point, polygon: Polygon): boolean
```

Uses **ray-casting algorithm**:
- Cast ray from point to infinity
- Count intersections with polygon edges
- Odd count = inside, even count = outside

#### Collision Detection

```typescript
isObjectInsideSpace(obj: SpaceObject, space: Polygon): boolean
```

Checks if all corners of object remain inside space boundary.

#### Rotation

```typescript
rotatePoint(point: Point, angle: number): Point
```

Applies rotation matrix:
```
x' = x * cos(θ) - y * sin(θ)
y' = x * sin(θ) + y * cos(θ)
```

### 3. Validation Module (`validation.ts`)

Handles JSON parsing and validation:

```typescript
parseAppState(jsonString: string): ValidationResult<AppState>
serializeAppState(state: AppState): string
```

**Validation Steps:**
1. JSON.parse (catches syntax errors)
2. Structure validation (required fields)
3. Type checking (numbers, strings, arrays)
4. Range validation (finite numbers)
5. Polygon validation (minimum 3 points)

## Component Details

### Canvas Component

The most complex component, handling all rendering and user interactions.

#### Rendering Pipeline

```typescript
useEffect(() => {
  // 1. Get canvas context
  const ctx = canvas.getContext('2d');

  // 2. Clear canvas
  ctx.clearRect(0, 0, width, height);

  // 3. Draw space outline
  drawPolygon(space.outline);

  // 4. Draw objects (sorted by z-index)
  objects.sort((a, b) => a.zIndex - b.zIndex)
    .forEach(obj => drawObject(obj));

  // 5. Draw rotation handle (if selected)
  if (selectedObject) {
    drawRotationHandle(selectedObject);
  }
}, [space, objects, selectedObjectId, viewport]);
```

#### Interaction State Machine

```
IDLE
  ├─ Click rotation handle → DRAGGING_ROTATION
  ├─ Click object → DRAGGING_OBJECT
  └─ Click empty space → PANNING

DRAGGING_OBJECT
  ├─ Mouse move → Update position (with collision check)
  └─ Mouse up → IDLE

DRAGGING_ROTATION
  ├─ Mouse move → Update rotation
  └─ Mouse up → IDLE

PANNING
  ├─ Mouse move → Update viewport offset
  └─ Mouse up → IDLE
```

#### Viewport Management

**Initial Scale Calculation:**
```typescript
const spaceWidth = (maxX - minX) / 10;  // in inches
const spaceHeight = (maxY - minY) / 10;

const scaleX = canvasWidth / (spaceWidth * 1.2);
const scaleY = canvasHeight / (spaceHeight * 1.2);
const baseScale = Math.min(scaleX, scaleY);
```

**Zoom to Cursor:**
```typescript
// 1. Get world point before zoom
const worldBefore = screenToWorld(mouseX, mouseY, viewport);

// 2. Apply zoom
const newViewport = { ...viewport, zoomLevel: newZoomLevel };

// 3. Get world point after zoom
const worldAfter = screenToWorld(mouseX, mouseY, newViewport);

// 4. Adjust offset to keep point steady
viewport.offsetX -= (worldAfter.x - worldBefore.x) / 10;
viewport.offsetY -= (worldAfter.y - worldBefore.y) / 10;
```

### SpaceEditor Component

JSON editor with live validation and error display.

**Features:**
- Controlled textarea component
- Real-time validation on every keystroke
- Error messages with descriptive feedback
- Auto-formatting with 2-space indentation

**Update Flow:**
```
User types in textarea
    ↓
handleChange event
    ↓
parseAppState(text)
    ↓
if valid: onUpdateState(data)
if invalid: setError(message)
```

### ObjectPalette Component

UI for creating new rectangular objects.

**Form Fields:**
- Name (optional, auto-generates "Object N")
- Width (inches, required)
- Height (inches, required)

**Object Creation:**
```typescript
const newObject: SpaceObject = {
  id: `obj-${Date.now()}-${randomString}`,
  name: name || `Object ${maxZIndex + 1}`,
  shape: createRectangle(width, height),
  position: spaceCenter,
  rotation: 0,
  zIndex: maxZIndex + 1
};
```

### PropertiesPanel Component

Edit properties of selected object with immediate updates.

**Controlled Inputs:**
- Name: Text input with onChange
- Position X/Y: Number inputs with onBlur (to allow typing decimals)
- Rotation: Number input with range 0-360
- Z-Index: Number input, minimum 0

**Update Strategy:**
- Immediate updates for name changes
- Blur-triggered updates for numeric fields (better UX when typing)
- Validation before updating state
- Revert to previous value if invalid

## Performance Considerations

### Rendering Optimization

- Full canvas redraw on each change (simple, fast enough for <20 objects)
- No need for requestAnimationFrame (React handles updates)
- Canvas size matches container (no unnecessary scaling)

### State Updates

- Immutable updates ensure React detects changes
- No deep comparisons needed
- Minimal re-renders due to component structure

### Memory Usage

- Single canvas element (not one per object)
- JSON serialization is lightweight (<1KB for typical layouts)
- No persistent history (could add for undo/redo)

## Design Decisions

### Why Canvas over SVG?

**Pros:**
- Simpler hit detection (manual but controlled)
- Better performance for frequent redraws
- Easier rotation transforms
- No DOM manipulation overhead

**Cons:**
- No built-in event handling per object
- Manual coordinate transforms required
- Not accessible (could add descriptions)

**Decision:** Canvas chosen for simplicity and performance.

### Why Tenths of Inches?

Allows 0.1" precision without floating point issues:
- Storage: Integers (easier to serialize/compare)
- Display: Divide by 10 for UI
- Precision: Adequate for furniture placement

### Why No External Libraries?

**Benefits:**
- Smaller bundle size (~100KB vs. 500KB+)
- No version conflicts
- Full control over behavior
- Educational value
- Easier to debug

**Trade-offs:**
- More code to maintain
- Missing advanced features (layers, export, etc.)

**Decision:** Keep it simple for MVP, add libraries if needed later.

## Extension Points

### Adding New Features

**Undo/Redo:**
```typescript
// Add state history stack
const [history, setHistory] = useState<AppState[]>([]);
const [historyIndex, setHistoryIndex] = useState(0);

// Push state on changes
const pushHistory = (state: AppState) => {
  setHistory(prev => [...prev.slice(0, historyIndex + 1), state]);
  setHistoryIndex(prev => prev + 1);
};
```

**Keyboard Shortcuts:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' && selectedObjectId) {
      handleDeleteObject(selectedObjectId);
    }
    // ... more shortcuts
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedObjectId]);
```

**Grid Display:**
```typescript
// In Canvas rendering
const drawGrid = (gridSize: number) => {
  const bounds = getPolygonBounds(space.outline);
  for (let x = bounds.minX; x <= bounds.maxX; x += gridSize) {
    // Draw vertical line
  }
  for (let y = bounds.minY; y <= bounds.maxY; y += gridSize) {
    // Draw horizontal line
  }
};
```

**Export as Image:**
```typescript
const exportPNG = () => {
  const canvas = canvasRef.current;
  const dataURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'space-layout.png';
  link.href = dataURL;
  link.click();
};
```

## Testing Strategy

### Manual Testing Checklist

- [ ] Create space from JSON
- [ ] Add multiple objects
- [ ] Drag objects around
- [ ] Rotate objects smoothly
- [ ] Pan canvas
- [ ] Zoom in/out
- [ ] Edit object properties
- [ ] Delete objects
- [ ] Invalid JSON shows error
- [ ] Collision detection works

### Edge Cases

- Empty objects array
- Single object
- Overlapping objects (z-index priority)
- Very small/large spaces
- Zoom limits (0.1x to 10x)
- Rotation wrap-around (360° → 0°)
- Objects partially outside space

## Browser Compatibility

**Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements:**
- ES2015 support
- Canvas API
- React 18 features (concurrent mode)

## Code Organization

```
src/
├── types.ts           # Type definitions (60 lines)
├── geometry.ts        # Math utilities (200 lines)
├── validation.ts      # JSON validation (100 lines)
├── Canvas.tsx         # Canvas component (250 lines)
├── SpaceEditor.tsx    # JSON editor (70 lines)
├── ObjectPalette.tsx  # Add objects UI (100 lines)
├── PropertiesPanel.tsx # Properties editor (150 lines)
├── App.tsx            # Main app (120 lines)
└── index.tsx          # Entry point (15 lines)

Total: ~1,065 lines of TypeScript
```

## Future Considerations

### Scalability

Current implementation handles:
- Up to 50 objects without performance issues
- Spaces up to 1000' × 1000'
- Zoom range 0.1x to 10x

For larger projects:
- Consider virtualization (only render visible objects)
- Add spatial indexing (quad-tree for hit detection)
- Implement object groups/layers

### Accessibility

Could add:
- Keyboard-only navigation
- Screen reader descriptions
- High contrast mode
- Focus indicators

### Mobile Support

Would require:
- Touch event handling
- Pinch-to-zoom gesture
- Responsive layout for small screens
- Virtual keyboard handling

## Conclusion

The Space Planner architecture prioritizes simplicity and clarity over advanced features. The modular structure makes it easy to understand, extend, and maintain. All complex operations (transforms, hit detection) are isolated in utility modules with clear interfaces.
