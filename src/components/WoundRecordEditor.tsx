import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Plus } from 'lucide-react';
import { supabase, WoundRecord, WoundImage, WoundCategory } from '../lib/supabase';
import ImageEditor from './ImageEditor';

type WoundRecordEditorProps = {
  record: WoundRecord | null;
  patientId: string;
  onClose: () => void;
  onSave: () => void;
};

export default function WoundRecordEditor({ record, patientId, onClose, onSave }: WoundRecordEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isPlanned, setIsPlanned] = useState(false);
  const [categories, setCategories] = useState<WoundCategory[]>([]);
  const [images, setImages] = useState<WoundImage[]>([]);
  const [editingImage, setEditingImage] = useState<WoundImage | null>(null);
  const [showPresetGallery, setShowPresetGallery] = useState(false);

  useEffect(() => {
    loadCategories();
    if (record) {
      setTitle(record.title);
      setDescription(record.description || '');
      setCategoryId(record.category_id || '');
      setIsPlanned(record.is_planned);
      loadImages();
    }
  }, [record]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('wound_categories')
      .select('*')
      .not('parent_id', 'is', null)
      .order('name');
    if (data) setCategories(data);
  };

  const loadImages = async () => {
    if (!record) return;
    const { data } = await supabase
      .from('wound_images')
      .select('*')
      .eq('wound_record_id', record.id)
      .order('order_index');
    if (data) setImages(data);
  };

  const handleSaveRecord = async () => {
    if (!title.trim()) {
      alert('Por favor ingrese un título');
      return;
    }

    const recordData = {
      patient_id: patientId,
      title,
      description,
      category_id: categoryId || null,
      is_planned: isPlanned,
      updated_at: new Date().toISOString()
    };

    if (record) {
      await supabase
        .from('wound_records')
        .update(recordData)
        .eq('id', record.id);
    } else {
      await supabase
        .from('wound_records')
        .insert(recordData);
    }

    onSave();
    onClose();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !record) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `wound-images/${fileName}`;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;

      const { data: imageData } = await supabase
        .from('wound_images')
        .insert({
          wound_record_id: record.id,
          image_url: imageUrl,
          annotations: [],
          transformations: {},
          order_index: images.length
        })
        .select()
        .single();

      if (imageData) {
        setImages([...images, imageData]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = async (imageId: string, annotations: any[], transformations: any) => {
    await supabase
      .from('wound_images')
      .update({ annotations, transformations })
      .eq('id', imageId);

    setEditingImage(null);
    loadImages();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">
              {record ? 'Editar Registro' : 'Nuevo Registro de Enfermería'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Herida Quirúrgica"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Descripción para: Herida Quirúrgica"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="planned"
                  checked={isPlanned}
                  onChange={(e) => setIsPlanned(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="planned" className="text-sm text-gray-700">
                  Planificada
                </label>
              </div>

              {record && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Imágenes</label>

                  <div className="flex gap-2 mb-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Subir Imagen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={() => setShowPresetGallery(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Galería de Imágenes
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {images.map(image => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.image_url}
                          alt="Wound"
                          className="w-full h-32 object-cover rounded border border-gray-200"
                        />
                        <button
                          onClick={() => setEditingImage(image)}
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="text-white text-sm">Editar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleSaveRecord}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      {editingImage && (
        <ImageEditor
          imageUrl={editingImage.image_url}
          annotations={editingImage.annotations}
          transformations={editingImage.transformations}
          onSave={(annotations, transformations) => handleSaveImage(editingImage.id, annotations, transformations)}
          onClose={() => setEditingImage(null)}
        />
      )}
    </>
  );
}
