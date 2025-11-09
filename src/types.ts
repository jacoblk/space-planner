/**
 * Core type definitions for the space planner application
 * All coordinates are in tenths of inches for precision
 */

export type Point = {
  x: number; // in tenths of inches
  y: number; // in tenths of inches
};

export type Polygon = {
  points: Point[];
};

export type SpaceObject = {
  id: string;
  name: string;
  shape: Polygon; // relative to object center (0,0)
  position: Point; // absolute position in space coordinates
  rotation: number; // degrees, clockwise
  zIndex: number; // for layering control
};

export type Space = {
  outline: Polygon;
};

export type AppState = {
  space: Space;
  objects: SpaceObject[];
  selectedObjectId: string | null;
};

export type Viewport = {
  offsetX: number; // pan offset in world units
  offsetY: number; // pan offset in world units
  scale: number; // pixels per inch (affected by zoom)
  baseScale: number; // initial scale to fit space
  zoomLevel: number; // multiplier on baseScale (1.0 = 100%)
};

export type InteractionMode =
  | 'idle'
  | 'dragging-object'
  | 'dragging-rotation'
  | 'panning'
  | 'editing-polygon'
  | 'dragging-vertex'
  | 'adding-vertex';

export type ScreenPoint = {
  x: number; // screen pixels
  y: number; // screen pixels
};

export type PolygonEditTarget =
  | { type: 'space' }
  | { type: 'object'; objectId: string };

export type PolygonEditState = {
  target: PolygonEditTarget;
  hoveredVertexIndex: number | null;
  hoveredEdgeIndex: number | null;
  draggedVertexIndex: number | null;
  measurementEdgeIndex: number | null; // which edge is being measured
};

export type LibraryItem = {
  id: string;
  name: string;
  shape: Polygon; // pre-defined shape relative to center (0,0)
  category: string;
  width: number; // reference dimension in inches
  height: number; // reference dimension in inches
  description?: string;
};

export type LibraryState = {
  items: LibraryItem[];
  customItems: LibraryItem[]; // user-saved items
};
