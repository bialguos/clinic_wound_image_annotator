# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clinic Wound Image Annotator is a React + TypeScript application for managing patient wound records with image annotation capabilities. The application allows healthcare professionals to document wound care through images with text annotations, transformations, and drawings.

## Development Commands

```bash
# Start development server (runs on default Vite port, typically 5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint
npm run lint

# Type check without emitting files
npm run typecheck
```

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **Database**: localStorage-based mock (replaces Supabase during development)

## Architecture

### State Management & Data Flow

The application uses React's built-in state management with a three-view system controlled by `App.tsx`:

1. **list**: Patient list view (PatientList component)
2. **detail**: Patient detail with wound records (PatientDetail component)
3. **editor**: Image editor with annotations (ImageEditor component)

Navigation flows: list → editor (when patient selected) or list → detail → editor (when wound record selected).

### Database Layer (`src/lib/supabase.ts`)

The application uses a **localStorage-based in-memory database** that mimics Supabase's API. This is not a real backend - all data is stored in the browser under the key `clinic_db_v1`.

**Key Types**:
- `Patient`: Patient demographic information
- `WoundRecord`: Wound care records linked to patients
- `WoundCategory`: Hierarchical categorization of wound types
- `WoundImage`: Image metadata with annotations and transformations
- `Annotation`: Text, drawing, or shape annotation on an image
- `Transformations`: Image transformations (rotation, flip, scale, crop)

**API Pattern**: The `supabase.from(table)` API supports basic chainable queries:
```typescript
// Select with filtering and ordering
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// Insert
await supabase.from('patients').insert(newPatient);

// Update with filters
await supabase.from('patients').eq('id', patientId).update(changes);
```

The database automatically seeds 10 sample patients and 2 wound categories on first load.

### Canvas-based Image Editor (`src/components/ImageEditor.tsx`)

The ImageEditor is the most complex component in the application, implementing a full-featured image annotation system using HTML5 Canvas.

**Core Capabilities**:
- Image loading from data URLs, local file upload, or preset gallery
- Real-time canvas rendering with image transformations
- Multiple annotation types: text, freehand drawing, shapes (rectangles/circles)
- Transform operations: rotation (90°/180°/270°), horizontal/vertical flip, zoom
- Interactive mouse-based drawing and annotation placement

**Canvas Rendering Strategy**:
1. Images are loaded and scaled to fit the container while maintaining aspect ratio
2. Canvas dimensions are set before applying transformations to avoid context reset
3. Transformations are applied using canvas context save/restore pattern
4. All annotations are redrawn on each render (useEffect depends on annotations, transformations, zoom, tempPath, tempShape)
5. Temporary drawing paths and shapes are rendered during user interaction

**Tool Modes**:
- `select`: Default selection mode
- `text`: Click canvas to add text annotation (uses prompt() for quick text input)
- `draw`: Click-and-drag freehand drawing (stores path as JSON array of points)
- `shape`: Click-and-drag to create rectangles or circles (circles auto-detected when width ≈ height)
- `transform`: Apply image transformations (rotation, flip)

**Annotation Storage**:
- Text annotations: Store position (x, y), content, font properties, color, rotation
- Draw annotations: Store path as JSON-serialized array of {x, y} points
- Shape annotations: Store shape data (rect: x,y,w,h or circle: cx,cy,r) as JSON

**Supporting Components**:
- `TransformToolbar`: Vertical toolbar for tool selection and transformation controls
- `TextAnnotationPanel`: Side panel for adding styled text annotations (appears when text tool is active)

### Component Structure

```
App.tsx (root)
├── PatientList.tsx
│   └── Displays searchable patient list
│   └── Uses supabase.from('patients') for data
├── PatientDetail.tsx
│   └── Shows patient info and wound records list
│   └── Contains WoundRecordsList component
│   └── Allows creating new wound records via WoundRecordEditor
└── ImageEditor.tsx
    ├── TransformToolbar.tsx (tool selection & transformations)
    └── TextAnnotationPanel.tsx (text annotation styling)
```

### Key Implementation Details

**SVG Data URL Placeholders**: When a patient is selected without an associated image, `App.tsx` generates an SVG data URL with the patient's name as placeholder content (see `generatePatientSvgDataUrl` function).

**Image Loading Error Handling**: The canvas renderer in ImageEditor includes error handling for failed image loads, displaying a fallback message. CORS issues are avoided by not setting `crossOrigin` on the Image element.

**Canvas Coordinate Mapping**: Mouse events are converted to canvas coordinates using `getCanvasPos()`, which accounts for the current zoom level and canvas bounding rectangle.

**Data Persistence**: The localStorage DB automatically saves on every mutation (insert/update). On page reload, all patient, wound record, and annotation data is restored from localStorage.

## File Structure

```
src/
├── App.tsx                    # Main app with view routing
├── main.tsx                   # React entry point
├── lib/
│   └── supabase.ts           # Mock database layer
└── components/
    ├── PatientList.tsx        # Patient search & selection
    ├── PatientDetail.tsx      # Patient details & wound records
    ├── WoundRecordsList.tsx   # List of wound records for a patient
    ├── WoundRecordEditor.tsx  # Form to create/edit wound records
    ├── ImageEditor.tsx        # Canvas-based image annotation
    ├── TransformToolbar.tsx   # Image editor toolbar
    └── TextAnnotationPanel.tsx # Text annotation controls
```

## Important Notes

- The app is fully client-side with no backend API
- All data is ephemeral and stored only in browser localStorage
- No authentication or user management is implemented
- The database mock API is intentionally simplified and may not support all Supabase features
- When extending the database schema, update both the TypeScript types and the seed data in `supabase.ts`
