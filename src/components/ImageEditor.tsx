import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, FlipHorizontal, FlipVertical, Type, Pencil, Square, Circle, Save } from 'lucide-react';
import TransformToolbar from './TransformToolbar';
import TextAnnotationPanel from './TextAnnotationPanel';
import { Annotation, Transformations } from '../lib/supabase';

type ImageEditorProps = {
  imageUrl: string;
  annotations: Annotation[];
  transformations: Transformations;
  onSave: (annotations: Annotation[], transformations: Transformations) => void;
  onClose: () => void;
};

type Tool = 'select' | 'text' | 'draw' | 'shape' | 'transform';

export default function ImageEditor({ imageUrl, annotations: initialAnnotations, transformations: initialTransformations, onSave, onClose }: ImageEditorProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [transformations, setTransformations] = useState<Transformations>(initialTransformations);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddText = (text: string, fontSize: number, fontFamily: string, fontWeight: string, fontStyle: string, textDecoration: string, color: string, rotation: number) => {
    const newAnnotation: Annotation = {
      id: crypto.randomUUID(),
      type: 'text',
      content: text,
      x: 100,
      y: 100,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      color,
      rotation
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  const handleTransform = (type: string, value?: number) => {
    setTransformations(prev => {
      switch (type) {
        case 'rotate-90':
          return { ...prev, rotation: ((prev.rotation || 0) + 90) % 360 };
        case 'rotate-180':
          return { ...prev, rotation: ((prev.rotation || 0) + 180) % 360 };
        case 'rotate-270':
          return { ...prev, rotation: ((prev.rotation || 0) + 270) % 360 };
        case 'flip-h':
          return { ...prev, flipH: !prev.flipH };
        case 'flip-v':
          return { ...prev, flipV: !prev.flipV };
        case 'zoom':
          if (value !== undefined) {
            setZoom(value);
          }
          return prev;
        default:
          return prev;
      }
    });
  };

  const handleSave = () => {
    onSave(annotations, transformations);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);

      if (transformations.rotation) {
        ctx.rotate((transformations.rotation * Math.PI) / 180);
      }

      if (transformations.flipH) {
        ctx.scale(-1, 1);
      }

      if (transformations.flipV) {
        ctx.scale(1, -1);
      }

      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      annotations.forEach(annotation => {
        if (annotation.type === 'text') {
          ctx.save();
          ctx.translate(annotation.x, annotation.y);
          if (annotation.rotation) {
            ctx.rotate((annotation.rotation * Math.PI) / 180);
          }
          ctx.font = `${annotation.fontStyle || 'normal'} ${annotation.fontWeight || 'normal'} ${annotation.fontSize || 16}px ${annotation.fontFamily || 'Arial'}`;
          ctx.fillStyle = annotation.color || '#000000';
          ctx.fillText(annotation.content, 0, 0);
          ctx.restore();
        }
      });
    };
    img.src = imageUrl;
  }, [imageUrl, annotations, transformations, zoom]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Editor de Imágenes</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <TransformToolbar
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
            onTransform={handleTransform}
            zoom={zoom}
          />

          <div className="flex-1 bg-gray-100 overflow-auto" ref={containerRef}>
            <div className="p-8 flex items-center justify-center min-h-full">
              <canvas
                ref={canvasRef}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                className="shadow-lg bg-white"
              />
            </div>
          </div>

          {selectedTool === 'text' && (
            <TextAnnotationPanel onAddText={handleAddText} />
          )}
        </div>
      </div>
    </div>
  );
}
