/**
 * Default library of furniture and object templates
 * All dimensions are in inches, shapes are in tenths of inches relative to center (0,0)
 */

import { LibraryItem, Polygon, SpaceLibraryItem } from './types';
import { createRectangle } from './geometry';

/**
 * Creates an L-shaped polygon
 */
function createLShape(
  width: number,
  height: number,
  armWidth: number,
  armDepth: number
): Polygon {
  const w = (width * 10) / 2;
  const h = (height * 10) / 2;
  const aw = (armWidth * 10) / 2;
  const ad = (armDepth * 10) / 2;

  return {
    points: [
      { x: -w, y: -h },
      { x: w, y: -h },
      { x: w, y: -h + ad },
      { x: -w + aw, y: -h + ad },
      { x: -w + aw, y: h },
      { x: -w, y: h }
    ]
  };
}

/**
 * Creates a circular polygon (approximated with segments)
 */
function createCircle(diameter: number, segments: number = 16): Polygon {
  const radius = (diameter * 10) / 2;
  const points = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    points.push({
      x: Math.round(radius * Math.cos(angle)),
      y: Math.round(radius * Math.sin(angle))
    });
  }

  return { points };
}

export const DEFAULT_LIBRARY_ITEMS: LibraryItem[] = [
  // SEATING
  {
    id: 'sofa-3seat',
    name: 'Sofa (3-Seat)',
    shape: createRectangle(84, 36),
    category: 'Seating',
    width: 84,
    height: 36,
    description: 'Standard 3-seat sofa'
  },
  {
    id: 'sofa-2seat',
    name: 'Sofa (2-Seat)',
    shape: createRectangle(60, 36),
    category: 'Seating',
    width: 60,
    height: 36,
    description: 'Loveseat or 2-seat sofa'
  },
  {
    id: 'sectional-l',
    name: 'L-Shaped Sectional',
    shape: createLShape(96, 96, 36, 36),
    category: 'Seating',
    width: 96,
    height: 96,
    description: 'L-shaped sectional sofa'
  },
  {
    id: 'armchair',
    name: 'Armchair',
    shape: createRectangle(36, 36),
    category: 'Seating',
    width: 36,
    height: 36,
    description: 'Single armchair'
  },
  {
    id: 'dining-chair',
    name: 'Dining Chair',
    shape: createRectangle(18, 20),
    category: 'Seating',
    width: 18,
    height: 20,
    description: 'Standard dining chair'
  },
  {
    id: 'office-chair',
    name: 'Office Chair',
    shape: createRectangle(24, 24),
    category: 'Seating',
    width: 24,
    height: 24,
    description: 'Swivel office chair'
  },

  // TABLES
  {
    id: 'coffee-table',
    name: 'Coffee Table',
    shape: createRectangle(48, 24),
    category: 'Tables',
    width: 48,
    height: 24,
    description: 'Rectangular coffee table'
  },
  {
    id: 'coffee-table-round',
    name: 'Round Coffee Table',
    shape: createCircle(36),
    category: 'Tables',
    width: 36,
    height: 36,
    description: 'Round coffee table'
  },
  {
    id: 'dining-table-4',
    name: 'Dining Table (4-Person)',
    shape: createRectangle(48, 36),
    category: 'Tables',
    width: 48,
    height: 36,
    description: 'Seats 4 people'
  },
  {
    id: 'dining-table-6',
    name: 'Dining Table (6-Person)',
    shape: createRectangle(72, 36),
    category: 'Tables',
    width: 72,
    height: 36,
    description: 'Seats 6 people'
  },
  {
    id: 'dining-table-8',
    name: 'Dining Table (8-Person)',
    shape: createRectangle(96, 42),
    category: 'Tables',
    width: 96,
    height: 42,
    description: 'Seats 8 people'
  },
  {
    id: 'desk',
    name: 'Desk',
    shape: createRectangle(60, 30),
    category: 'Tables',
    width: 60,
    height: 30,
    description: 'Standard office desk'
  },
  {
    id: 'side-table',
    name: 'Side Table',
    shape: createRectangle(20, 20),
    category: 'Tables',
    width: 20,
    height: 20,
    description: 'Small side/end table'
  },

  // BEDS
  {
    id: 'bed-twin',
    name: 'Twin Bed',
    shape: createRectangle(39, 75),
    category: 'Beds',
    width: 39,
    height: 75,
    description: 'Twin size bed'
  },
  {
    id: 'bed-full',
    name: 'Full Bed',
    shape: createRectangle(54, 75),
    category: 'Beds',
    width: 54,
    height: 75,
    description: 'Full/double bed'
  },
  {
    id: 'bed-queen',
    name: 'Queen Bed',
    shape: createRectangle(60, 80),
    category: 'Beds',
    width: 60,
    height: 80,
    description: 'Queen size bed'
  },
  {
    id: 'bed-king',
    name: 'King Bed',
    shape: createRectangle(76, 80),
    category: 'Beds',
    width: 76,
    height: 80,
    description: 'King size bed'
  },

  // STORAGE
  {
    id: 'dresser',
    name: 'Dresser',
    shape: createRectangle(60, 20),
    category: 'Storage',
    width: 60,
    height: 20,
    description: 'Standard dresser'
  },
  {
    id: 'nightstand',
    name: 'Nightstand',
    shape: createRectangle(20, 18),
    category: 'Storage',
    width: 20,
    height: 18,
    description: 'Bedside table'
  },
  {
    id: 'bookcase',
    name: 'Bookcase',
    shape: createRectangle(36, 12),
    category: 'Storage',
    width: 36,
    height: 12,
    description: 'Standard bookcase'
  },
  {
    id: 'tv-stand',
    name: 'TV Stand',
    shape: createRectangle(60, 18),
    category: 'Storage',
    width: 60,
    height: 18,
    description: 'TV console/stand'
  },

  // APPLIANCES
  {
    id: 'refrigerator',
    name: 'Refrigerator',
    shape: createRectangle(36, 30),
    category: 'Appliances',
    width: 36,
    height: 30,
    description: 'Standard refrigerator'
  },
  {
    id: 'stove',
    name: 'Stove/Range',
    shape: createRectangle(30, 24),
    category: 'Appliances',
    width: 30,
    height: 24,
    description: 'Kitchen stove/range'
  },
  {
    id: 'dishwasher',
    name: 'Dishwasher',
    shape: createRectangle(24, 24),
    category: 'Appliances',
    width: 24,
    height: 24,
    description: 'Built-in dishwasher'
  },
  {
    id: 'washer',
    name: 'Washer',
    shape: createRectangle(27, 27),
    category: 'Appliances',
    width: 27,
    height: 27,
    description: 'Washing machine'
  },
  {
    id: 'dryer',
    name: 'Dryer',
    shape: createRectangle(27, 27),
    category: 'Appliances',
    width: 27,
    height: 27,
    description: 'Clothes dryer'
  }
];

/**
 * Get all unique categories from library items
 */
export function getLibraryCategories(items: LibraryItem[]): string[] {
  const categories = new Set(items.map(item => item.category));
  return Array.from(categories).sort();
}

/**
 * Default library of space templates with pre-arranged furniture
 */
export const DEFAULT_SPACE_LIBRARY_ITEMS: SpaceLibraryItem[] = [
  {
    id: 'space-bedroom-small',
    name: 'Small Bedroom',
    space: {
      outline: createRectangle(120, 120)
    },
    objects: [
      {
        id: 'obj-bed',
        name: 'Queen Bed',
        shape: createRectangle(60, 80),
        position: { x: 0, y: -100 },
        rotation: 0,
        zIndex: 1
      },
      {
        id: 'obj-nightstand1',
        name: 'Nightstand',
        shape: createRectangle(20, 18),
        position: { x: 400, y: -100 },
        rotation: 0,
        zIndex: 2
      },
      {
        id: 'obj-nightstand2',
        name: 'Nightstand',
        shape: createRectangle(20, 18),
        position: { x: -400, y: -100 },
        rotation: 0,
        zIndex: 3
      },
      {
        id: 'obj-dresser',
        name: 'Dresser',
        shape: createRectangle(60, 20),
        position: { x: 0, y: 400 },
        rotation: 0,
        zIndex: 4
      }
    ],
    category: 'Bedroom',
    description: '10x10 ft bedroom with queen bed and furniture'
  },
  {
    id: 'space-living-room',
    name: 'Living Room',
    space: {
      outline: createRectangle(180, 144)
    },
    objects: [
      {
        id: 'obj-sofa',
        name: 'Sofa (3-Seat)',
        shape: createRectangle(84, 36),
        position: { x: 0, y: 200 },
        rotation: 0,
        zIndex: 1
      },
      {
        id: 'obj-coffee-table',
        name: 'Coffee Table',
        shape: createRectangle(48, 24),
        position: { x: 0, y: 0 },
        rotation: 0,
        zIndex: 2
      },
      {
        id: 'obj-tv-stand',
        name: 'TV Stand',
        shape: createRectangle(60, 18),
        position: { x: 0, y: -500 },
        rotation: 0,
        zIndex: 3
      },
      {
        id: 'obj-armchair1',
        name: 'Armchair',
        shape: createRectangle(36, 36),
        position: { x: -500, y: 100 },
        rotation: 270,
        zIndex: 4
      },
      {
        id: 'obj-armchair2',
        name: 'Armchair',
        shape: createRectangle(36, 36),
        position: { x: 500, y: 100 },
        rotation: 90,
        zIndex: 5
      }
    ],
    category: 'Living',
    description: '15x12 ft living room with seating area'
  },
  {
    id: 'space-home-office',
    name: 'Home Office',
    space: {
      outline: createRectangle(120, 96)
    },
    objects: [
      {
        id: 'obj-desk',
        name: 'Desk',
        shape: createRectangle(60, 30),
        position: { x: 0, y: -200 },
        rotation: 0,
        zIndex: 1
      },
      {
        id: 'obj-office-chair',
        name: 'Office Chair',
        shape: createRectangle(24, 24),
        position: { x: 0, y: 50 },
        rotation: 180,
        zIndex: 2
      },
      {
        id: 'obj-bookcase',
        name: 'Bookcase',
        shape: createRectangle(36, 12),
        position: { x: -350, y: -200 },
        rotation: 0,
        zIndex: 3
      },
      {
        id: 'obj-side-table',
        name: 'Side Table',
        shape: createRectangle(20, 20),
        position: { x: 400, y: 250 },
        rotation: 0,
        zIndex: 4
      }
    ],
    category: 'Office',
    description: '10x8 ft home office setup'
  },
  {
    id: 'space-dining-room',
    name: 'Dining Room',
    space: {
      outline: createRectangle(144, 120)
    },
    objects: [
      {
        id: 'obj-dining-table',
        name: 'Dining Table (6-Person)',
        shape: createRectangle(72, 36),
        position: { x: 0, y: 0 },
        rotation: 0,
        zIndex: 1
      },
      {
        id: 'obj-chair1',
        name: 'Dining Chair',
        shape: createRectangle(18, 20),
        position: { x: -270, y: -200 },
        rotation: 0,
        zIndex: 2
      },
      {
        id: 'obj-chair2',
        name: 'Dining Chair',
        shape: createRectangle(18, 20),
        position: { x: 0, y: -200 },
        rotation: 0,
        zIndex: 3
      },
      {
        id: 'obj-chair3',
        name: 'Dining Chair',
        shape: createRectangle(18, 20),
        position: { x: 270, y: -200 },
        rotation: 0,
        zIndex: 4
      },
      {
        id: 'obj-chair4',
        name: 'Dining Chair',
        shape: createRectangle(18, 20),
        position: { x: -270, y: 200 },
        rotation: 180,
        zIndex: 5
      },
      {
        id: 'obj-chair5',
        name: 'Dining Chair',
        shape: createRectangle(18, 20),
        position: { x: 0, y: 200 },
        rotation: 180,
        zIndex: 6
      },
      {
        id: 'obj-chair6',
        name: 'Dining Chair',
        shape: createRectangle(18, 20),
        position: { x: 270, y: 200 },
        rotation: 180,
        zIndex: 7
      }
    ],
    category: 'Dining',
    description: '12x10 ft dining room with table and 6 chairs'
  }
];

/**
 * Get all unique categories from space library items
 */
export function getSpaceLibraryCategories(items: SpaceLibraryItem[]): string[] {
  const categories = new Set(items.map(item => item.category));
  return Array.from(categories).sort();
}
