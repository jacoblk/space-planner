# Space Planner

An interactive space planning application built with React and TypeScript. Design room layouts by dragging, rotating, and arranging furniture with precise measurements.

## Features

- **Custom Space Dimensions**: Define any polygon-shaped room via JSON
- **Interactive Canvas**: Drag objects, rotate them, pan and zoom the view
- **Precise Measurements**: All dimensions in inches with 0.1" precision (tenths of inches)
- **Real-time JSON Editor**: Edit space and objects with live validation
- **Collision Detection**: Objects cannot be moved outside the room boundaries
- **Properties Panel**: Fine-tune object positions, rotations, and layering
- **Responsive Design**: Canvas adapts to window size

## Quick Start

### Prerequisites

- Node.js 14 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd space-planner

# Install dependencies
npm install

# Start development server
npm start
```

The application will open in your browser at `http://localhost:3000`

## Usage

### Initial State

The app starts with:
- A **12' × 10' rectangular room**
- A **6' × 3' sofa** in the center

### Basic Interactions

| Action | How To |
|--------|--------|
| **Select object** | Click on it (turns blue) |
| **Move object** | Click and drag |
| **Rotate object** | Drag the blue circle handle |
| **Pan canvas** | Click and drag empty space |
| **Zoom in/out** | Scroll mouse wheel |
| **Add object** | Enter dimensions (left panel) and click "Add Rectangle" |
| **Edit properties** | Use Properties panel (left, bottom) |
| **Edit space/objects** | Modify JSON (right panel) |

### Adding Furniture

1. In the **Object Palette** (left sidebar):
   - Enter a name (optional)
   - Enter width in inches (e.g., 72 for a 6-foot sofa)
   - Enter height in inches (e.g., 36 for a 3-foot depth)
   - Click "Add Rectangle"

2. The new object appears at the center of the room
3. Drag it to position and rotate as needed

### Common Furniture Sizes

- **Sofa**: 72-96" wide × 30-40" deep
- **Coffee Table**: 48-54" wide × 24-30" deep
- **Dining Table** (4-seat): 48" wide × 30" deep
- **King Bed**: 76" wide × 80" long
- **Desk**: 48-60" wide × 24-30" deep

### Editing via JSON

The right panel shows the complete state as JSON. You can:

1. **Copy** the JSON to save your layout
2. **Paste** previously saved JSON to restore a layout
3. **Edit** directly to change room dimensions or object properties

#### Example: Create a 15' × 12' Room

```json
{
  "space": {
    "outline": {
      "points": [
        {"x": 0, "y": 0},
        {"x": 1800, "y": 0},
        {"x": 1800, "y": 1440},
        {"x": 0, "y": 1440}
      ]
    }
  },
  "objects": []
}
```

**Note**: Coordinates are in tenths of inches (e.g., 1800 = 180" = 15')

### Properties Panel

When an object is selected, use the Properties Panel to:

- **Change name**: Identify objects easily
- **Set exact position**: Enter X/Y coordinates in inches
- **Set exact rotation**: Enter degrees (0-360)
- **Change Z-Index**: Control which objects appear on top
- **Delete object**: Remove from the layout

## Project Structure

```
space-planner/
├── src/
│   ├── App.tsx              # Main application component
│   ├── Canvas.tsx           # Canvas rendering and interactions
│   ├── SpaceEditor.tsx      # JSON editor with validation
│   ├── ObjectPalette.tsx    # UI for adding objects
│   ├── PropertiesPanel.tsx  # Edit selected object properties
│   ├── types.ts             # TypeScript type definitions
│   ├── geometry.ts          # Geometry utilities
│   ├── validation.ts        # JSON validation
│   └── index.tsx            # Entry point
├── public/
│   └── index.html           # HTML template
├── package.json
├── tsconfig.json
└── README.md
```

## Technical Details

### Coordinate System

- **Units**: All internal coordinates in tenths of inches (0.1" precision)
- **Origin**: Top-left corner (0, 0)
- **X-axis**: Increases to the right
- **Y-axis**: Increases downward

### Transform Pipeline

The application uses a three-stage coordinate system:

1. **World coordinates**: Actual measurements (tenths of inches)
2. **View coordinates**: After pan/zoom transforms
3. **Screen coordinates**: Canvas pixels

### Collision Detection

Objects use ray-casting algorithm for hit detection. When dragging, the app checks if all corners of the object remain inside the space boundary. If not, the move is prevented.

### Technologies

- **React 18**: UI framework
- **TypeScript**: Type safety
- **HTML5 Canvas**: Rendering engine
- **No external dependencies**: Pure React implementation

## Development

### Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Building for Production

```bash
npm run build
```

Creates an optimized production build in the `build/` directory.

## Tips

1. **Use the JSON editor** for complex room shapes (L-shaped, etc.)
2. **Z-Index** controls layering - higher numbers appear on top
3. **Save your work** by copying the JSON to a text file
4. **Precise positioning** is easier using the Properties panel than dragging
5. **Zoom in** for fine-tuned placement

## Troubleshooting

**Can't drag object?**
- The object may be outside room boundaries
- Edit position in Properties panel to bring it back

**JSON validation error?**
- Check the error message below the editor
- Ensure all coordinates are valid numbers
- Verify all required fields are present

**Objects not visible?**
- Try zooming out (scroll wheel)
- Check that objects exist in the JSON

## Future Enhancements

Potential features for future versions:

- Undo/redo functionality
- Keyboard shortcuts (Delete, arrow keys for nudging)
- Grid display with snap-to-grid
- Copy/paste objects
- Furniture templates library
- Export as PNG or PDF
- Multi-room support
- Interior walls

## License

MIT License - feel free to use and modify as needed.

## Contributing

This is a small, self-contained project. Feel free to fork and customize for your needs!
