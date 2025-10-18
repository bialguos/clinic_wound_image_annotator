import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Patient, WoundRecord, Annotation, Transformations } from './lib/supabase';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import ImageEditor from './components/ImageEditor';

type View = 'list' | 'detail' | 'editor';

function App() {
  const [view, setView] = useState<View>('list');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingImage, setEditingImage] = useState<{ imageUrl: string; annotations: Annotation[]; transformations: Transformations } | null>(null);

  const handleSelectPatient = (patient: Patient) => {
    // Open ImageEditor directly for the selected patient with a placeholder image
    setSelectedPatient(patient);
    const svg = generatePatientSvgDataUrl(patient.full_name);
    setEditingImage({
      imageUrl: svg,
      annotations: [],
      transformations: {}
    });
    setView('editor');
  };

  const handleOpenWoundRecord = (record: WoundRecord) => {
    // Open image editor for a wound record (use title as placeholder)
    const svg = generatePatientSvgDataUrl(record.title || 'Registro');
    setEditingImage({ imageUrl: svg, annotations: [], transformations: {} });
    setSelectedPatient(null);
    setView('editor');
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setView('list');
  };

  

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Cuidados de Enfermería</h1>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {view === 'list' && (
          <div className="h-full max-w-4xl mx-auto">
            <PatientList onSelectPatient={handleSelectPatient} />
          </div>
        )}

        {view === 'detail' && selectedPatient && (
          <PatientDetail
            patient={selectedPatient}
            onBack={handleBack}
            onOpenWoundRecord={handleOpenWoundRecord}
          />
        )}

        {view === 'editor' && selectedPatient && editingImage && (
          <ImageEditor
            imageUrl={editingImage.imageUrl}
            annotations={editingImage.annotations}
            transformations={editingImage.transformations}
            onSave={(annotations, transformations) => {
              // For now just close editor after save; optionally persist later
              console.log('Saved annotations for', selectedPatient?.id, annotations, transformations);
              setEditingImage(null);
              setView('list');
            }}
            onClose={() => {
              setEditingImage(null);
              setView('list');
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&"']/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return c;
    }
  });
}

function generatePatientSvgDataUrl(name: string) {
  const safe = escapeXml(name);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'><rect width='100%' height='100%' fill='#ffffff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#0f172a' font-family='Inter, Arial, sans-serif' font-size='48'>${safe}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
