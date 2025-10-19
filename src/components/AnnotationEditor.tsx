import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Annotation } from '../lib/supabase';

type AnnotationEditorProps = {
  annotation: Annotation;
  onUpdate: (annotation: Annotation) => void;
  onPreview?: (annotation: Annotation) => void;
  onDelete: () => void;
};

export default function AnnotationEditor({ annotation, onUpdate, onPreview, onDelete }: AnnotationEditorProps) {
  const [content, setContent] = useState(annotation.content);
  const [fontSize, setFontSize] = useState(annotation.fontSize || 16);
  const [fontFamily, setFontFamily] = useState(annotation.fontFamily || 'Arial');
  const [fontWeight, setFontWeight] = useState(annotation.fontWeight || 'normal');
  const [fontStyle, setFontStyle] = useState(annotation.fontStyle || 'normal');
  const [textDecoration, setTextDecoration] = useState(annotation.textDecoration || 'none');
  const [color, setColor] = useState(annotation.color || '#000000');
  const [rotation, setRotation] = useState(annotation.rotation || 0);

  // Shape-specific state - always initialize even if not used
  const [shapeData, setShapeData] = useState<any>(() => {
    try {
      return JSON.parse((annotation as any).content || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    setContent(annotation.content);
    setFontSize(annotation.fontSize || 16);
    setFontFamily(annotation.fontFamily || 'Arial');
    setFontWeight(annotation.fontWeight || 'normal');
    setFontStyle(annotation.fontStyle || 'normal');
    setTextDecoration(annotation.textDecoration || 'none');
    setColor(annotation.color || '#000000');
    setRotation(annotation.rotation || 0);

    // Update shape data when annotation changes
    if (annotation.type === 'shape') {
      try {
        setShapeData(JSON.parse((annotation as any).content || '{}'));
      } catch {
        setShapeData({});
      }
    }
  }, [annotation]);

  // Preview changes in real-time
  useEffect(() => {
    if (onPreview && annotation.type === 'text') {
      onPreview({
        ...annotation,
        content,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        textDecoration,
        color,
        rotation
      });
    }
  }, [content, fontSize, fontFamily, fontWeight, fontStyle, textDecoration, color, rotation]);

  // Preview shape changes in real-time
  useEffect(() => {
    if (onPreview && annotation.type === 'shape') {
      onPreview({
        ...annotation,
        content: JSON.stringify(shapeData)
      });
    }
  }, [shapeData]);

  const handleApply = () => {
    onUpdate({
      ...annotation,
      content,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      color,
      rotation
    });
  };

  if (annotation.type === 'draw') {
    return (
      <div className="w-80 bg-white border-l shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Dibujo</h3>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Dibujo a mano alzada</p>
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>
    );
  }

  if (annotation.type === 'shape') {
    const handleUpdateShape = () => {
      const updatedAnnotation = {
        ...annotation,
        content: JSON.stringify(shapeData)
      };
      onUpdate(updatedAnnotation);
    };

    return (
      <div className="w-80 bg-white border-l shadow-lg p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Forma</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <p className="text-sm text-gray-600 capitalize">
              {shapeData.kind === 'rect' ? 'Rectángulo' : shapeData.kind === 'circle' ? 'Círculo' : 'Flecha'}
            </p>
          </div>

          {shapeData.kind === 'arrow' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección de la flecha</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setShapeData({ ...shapeData, arrowDirection: 'end' })}
                    className={`w-full px-3 py-2 text-sm border rounded transition-colors ${
                      shapeData.arrowDirection === 'end'
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    → Flecha al final
                  </button>
                  <button
                    onClick={() => setShapeData({ ...shapeData, arrowDirection: 'start' })}
                    className={`w-full px-3 py-2 text-sm border rounded transition-colors ${
                      shapeData.arrowDirection === 'start'
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    ← Flecha al inicio
                  </button>
                  <button
                    onClick={() => setShapeData({ ...shapeData, arrowDirection: 'both' })}
                    className={`w-full px-3 py-2 text-sm border rounded transition-colors ${
                      shapeData.arrowDirection === 'both'
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    ↔ Flecha en ambos extremos
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rotación: {shapeData.rotation || 0}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={shapeData.rotation || 0}
                  onChange={(e) => setShapeData({ ...shapeData, rotation: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color del borde</label>
            <input
              type="color"
              value={shapeData.stroke || '#000000'}
              onChange={(e) => setShapeData({ ...shapeData, stroke: e.target.value })}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grosor del borde: {shapeData.strokeWidth || 2}px
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={shapeData.strokeWidth || 2}
              onChange={(e) => setShapeData({ ...shapeData, strokeWidth: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {shapeData.kind !== 'arrow' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color de relleno</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={shapeData.fill === 'transparent' ? '#ffffff' : (shapeData.fill || '#ffffff')}
                  onChange={(e) => setShapeData({ ...shapeData, fill: e.target.value })}
                  className="flex-1 h-10 rounded cursor-pointer"
                />
                <button
                  onClick={() => setShapeData({ ...shapeData, fill: 'transparent' })}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  Sin relleno
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleUpdateShape}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Aplicar
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l shadow-lg p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Editar Texto</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Texto</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tamaño: {fontSize}px
          </label>
          <input
            type="range"
            min="8"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fuente</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
          <select
            value={fontWeight}
            onChange={(e) => setFontWeight(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="normal">Normal</option>
            <option value="bold">Negrita</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estilo</label>
          <select
            value={fontStyle}
            onChange={(e) => setFontStyle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="normal">Normal</option>
            <option value="italic">Cursiva</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Decoración</label>
          <select
            value={textDecoration}
            onChange={(e) => setTextDecoration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">Ninguna</option>
            <option value="underline">Subrayado</option>
            <option value="line-through">Tachado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rotación: {rotation}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Aplicar
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
