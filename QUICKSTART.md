# Space Planner - Quick Start Guide

## Installation & Running

```bash
npm install
npm start
```

Opens at `http://localhost:3000`

## First Steps

1. **Click the sofa** - It turns blue (selected)
2. **Drag the sofa** - Move it around
3. **Drag the blue circle** - Rotate the sofa
4. **Scroll wheel** - Zoom in/out
5. **Click empty space and drag** - Pan the canvas

## Quick Reference

### Adding Objects

**Left Panel → Add Rectangle**
- Name: "Coffee Table" (optional)
- Width: 48 inches
- Height: 24 inches
- Click "Add Rectangle"

### Editing Properties

**Left Panel → Properties** (when object selected)
- Position X/Y: Exact placement in inches
- Rotation: 0-360 degrees
- Z-Index: Layer control (higher = on top)

### Changing Room Size

**Right Panel → JSON Editor**

Example - 15' × 12' room:
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

**Remember**: Coordinates are in tenths of inches
- 1800 = 180" = 15'
- 1440 = 144" = 12'

## Common Furniture Dimensions

| Item | Width (in) | Depth (in) |
|------|------------|------------|
| Sofa | 72-96 | 30-40 |
| Loveseat | 58-64 | 30-40 |
| Coffee Table | 48-54 | 24-30 |
| Dining Table (4) | 48 | 30 |
| King Bed | 76 | 80 |
| Queen Bed | 60 | 80 |
| Desk | 48-60 | 24-30 |
| TV Stand | 48-72 | 18-24 |

## Keyboard & Mouse

| Action | Control |
|--------|---------|
| Select | Click object |
| Move | Click + drag object |
| Rotate | Click + drag blue circle |
| Pan | Click + drag empty space |
| Zoom | Scroll wheel |
| Delete | Properties panel → Delete button |

## Saving Your Work

1. **Copy** the JSON from the right panel
2. **Save** it to a `.json` file
3. **Paste** it back later to restore

## Tips

- **Precise placement**: Use Properties panel, not dragging
- **Complex rooms**: Edit JSON to create L-shapes, etc.
- **Layering**: Adjust Z-Index to control what's on top
- **Can't move object?**: It might be outside room bounds - edit position in Properties

## Example Workflow

### Living Room Layout

1. **Create room** (15' × 12'):
   - Edit JSON as shown above

2. **Add sofa** (84" × 36"):
   - Width: 84, Height: 36
   - Position against a wall

3. **Add coffee table** (48" × 24"):
   - Width: 48, Height: 24
   - Center in front of sofa

4. **Add TV stand** (60" × 18"):
   - Width: 60, Height: 18
   - Position opposite sofa

5. **Add armchair** (36" × 36"):
   - Width: 36, Height: 36
   - Position at angle

6. **Fine-tune**:
   - Select each object
   - Use Properties to set exact positions
   - Adjust rotations as needed

## Troubleshooting

**Object won't move?**
→ Check it's not outside room bounds

**Can't see objects?**
→ Zoom out (scroll wheel)

**JSON error?**
→ Read error message, check for missing commas/brackets

**Want to start over?**
→ Refresh page to reset to initial state

## Next Steps

- Experiment with different room shapes
- Try creating your actual room layout
- Save multiple layouts for comparison
- Read README.md for detailed documentation
