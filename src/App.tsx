import { Annotation, Patient, Transformations, WoundRecord, WoundImage, supabase } from './lib/supabase';

import { Heart } from 'lucide-react';
import ImageEditor from './components/ImageEditor';
import PatientDetail from './components/PatientDetail';
import PatientList from './components/PatientList';
import { useState, useEffect } from 'react';

type View = 'list' | 'detail' | 'editor';

function App() {
  const [view, setView] = useState<View>('list');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingImage, setEditingImage] = useState<{ id?: string; imageUrl: string; annotations: Annotation[]; transformations: Transformations; imageName?: string } | null>(null);
  const [savedImages, setSavedImages] = useState<WoundImage[]>([]);

  // Load saved images on mount and when patient changes
  useEffect(() => {
    loadSavedImages();
  }, [selectedPatient]);

  const loadSavedImages = async () => {
    if (!selectedPatient) {
      const { data } = await supabase.from('wound_images').select();
      setSavedImages(data || []);
    } else {
      // Filter by patient if needed (for now show all)
      const { data } = await supabase.from('wound_images').select();
      setSavedImages(data || []);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    // Open ImageEditor directly for the selected patient with a placeholder image
    setSelectedPatient(patient);
    const svg = generatePatientSvgDataUrl(patient.full_name);
    setEditingImage({
      imageUrl: svg,
      annotations: [],
      transformations: {},
      imageName: ''
    });
    setView('editor');
  };

  const handleOpenWoundRecord = (record: WoundRecord) => {
    // Open image editor for a wound record (use title as placeholder)
    const svg = generatePatientSvgDataUrl(record.title || 'Registro');
    setEditingImage({ imageUrl: svg, annotations: [], transformations: {}, imageName: '' });
    setSelectedPatient(null);
    setView('editor');
  };

  const handleEditSavedImage = (image: WoundImage) => {
    setEditingImage({
      id: image.id,
      imageUrl: image.image_url,
      annotations: image.annotations || [],
      transformations: image.transformations || {},
      imageName: image.image_name || ''
    });
    setView('editor');
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setView('list');
  };

  const handleSaveImage = async (annotations: Annotation[], transformations: Transformations, imageName: string, finalImageUrl: string) => {
    try {
      if (editingImage?.id) {
        // Update existing image
        await supabase.from('wound_images').eq('id', editingImage.id).update({
          image_url: finalImageUrl, // Save the final rendered image
          annotations,
          transformations,
          image_name: imageName,
          updated_at: new Date().toISOString()
        });
      } else {
        // Create new image
        await supabase.from('wound_images').insert({
          wound_record_id: 'default', // You can link to actual wound record later
          image_url: finalImageUrl, // Save the final rendered image
          thumbnail_url: null,
          image_name: imageName,
          annotations,
          transformations,
          order_index: savedImages.length
        });
      }

      // Reload saved images
      await loadSavedImages();

      setEditingImage(null);
      setView('list');
      alert('Imagen guardada correctamente');
    } catch (error) {
      console.error('Error al guardar imagen:', error);
      alert('Error al guardar la imagen');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      return;
    }

    try {
      const db = JSON.parse(localStorage.getItem('clinic_db_v1') || '{}');
      if (db.wound_images) {
        db.wound_images = db.wound_images.filter((img: WoundImage) => img.id !== imageId);
        localStorage.setItem('clinic_db_v1', JSON.stringify(db));
      }

      // Reload saved images
      await loadSavedImages();
      alert('Imagen eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      alert('Error al eliminar la imagen');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Editor de Imagenes</h1>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {view === 'list' && (
          <div className="h-full flex">
            {/* Patient List on the left */}
            <div className="w-96 border-r">
              <PatientList onSelectPatient={handleSelectPatient} />
            </div>

            {/* Saved Images List on the right */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Imágenes Guardadas</h2>

                {savedImages.length === 0 ? (
                  <div className="bg-white rounded-lg border p-8 text-center">
                    <p className="text-gray-500">No hay imágenes guardadas todavía</p>
                    <p className="text-sm text-gray-400 mt-2">Selecciona un paciente para crear una nueva imagen</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border divide-y">
                    {savedImages.map((image) => (
                      <div
                        key={image.id}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleEditSavedImage(image)}
                        >
                          <div className="font-medium text-gray-900">
                            {image.image_name || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            {new Date(image.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image.id);
                          }}
                          className="ml-4 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'detail' && selectedPatient && (
          <PatientDetail
            patient={selectedPatient}
            onBack={handleBack}
            onOpenWoundRecord={handleOpenWoundRecord}
          />
        )}

        {view === 'editor' && editingImage && (
          <ImageEditor
            imageUrl={editingImage.imageUrl}
            annotations={editingImage.annotations}
            transformations={editingImage.transformations}
            imageName={editingImage.imageName}
            onSave={handleSaveImage}
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
