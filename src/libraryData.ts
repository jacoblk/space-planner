/**
 * Default library of furniture and object templates
 * All dimensions are in inches, shapes are in tenths of inches relative to center (0,0)
 */

import { LibraryItem, Polygon } from './types';
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
