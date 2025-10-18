import { useState, useRef, useEffect } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
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
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>(imageUrl);
  const [showGallery, setShowGallery] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPath, setTempPath] = useState<Array<{x:number;y:number}>>([]);
  const [tempShape, setTempShape] = useState<{startX:number;startY:number;endX:number;endY:number} | null>(null);

  useEffect(() => {
    setCurrentImageUrl(imageUrl);
  }, [imageUrl]);

  const presetImages = [
    `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='#f8fafc'/><circle cx='400' cy='300' r='120' fill='#60a5fa'/><text x='50%' y='90%' font-size='28' text-anchor='middle' fill='#0f172a'>Preset 1</text></svg>`)}`,
    `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='#fff7ed'/><rect x='160' y='120' width='480' height='360' fill='#fb923c'/><text x='50%' y='90%' font-size='28' text-anchor='middle' fill='#0f172a'>Preset 2</text></svg>`)}`,
    `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='#ecfccb'/><path d='M200 400 Q400 100 600 400' stroke='#4ade80' stroke-width='24' fill='none'/><text x='50%' y='90%' font-size='28' text-anchor='middle' fill='#0f172a'>Preset 3</text></svg>`)}`
  ];

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

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setCurrentImageUrl(url);
      setShowGallery(false);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // determine display size: if image larger than container, scale to fit; otherwise keep original size
      const container = containerRef.current;
      let targetW = img.width;
      let targetH = img.height;
      if (container) {
        const rect = container.getBoundingClientRect();
        const maxW = rect.width - 32; // padding
        const maxH = rect.height - 32;
        const scale = Math.min(1, Math.min(maxW / img.width, maxH / img.height));
        targetW = Math.round(img.width * scale);
        targetH = Math.round(img.height * scale);
      }

      canvas.width = targetW;
      canvas.height = targetH;
      setDisplaySize({ w: targetW, h: targetH });

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

  // draw image scaled to canvas
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
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
        if (annotation.type === 'draw') {
          try {
            const pts = JSON.parse((annotation as any).content) as Array<{x:number;y:number}>;
            if (pts && pts.length > 0) {
              ctx.save();
              ctx.beginPath();
              ctx.strokeStyle = (annotation as any).color || '#ff0000';
              ctx.lineWidth = (annotation as any).width || 3;
              ctx.lineJoin = 'round';
              ctx.lineCap = 'round';
              ctx.moveTo(pts[0].x, pts[0].y);
              for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
              ctx.stroke();
              ctx.restore();
            }
          } catch (e) {
            // ignore parse errors
          }
        }
        if (annotation.type === 'shape') {
          try {
            const data = JSON.parse((annotation as any).content) as any;
            ctx.save();
            ctx.strokeStyle = data.stroke || '#000000';
            ctx.lineWidth = data.strokeWidth || 2;
            ctx.fillStyle = data.fill || 'transparent';
            if (data.kind === 'rect') {
              ctx.fillRect(data.x, data.y, data.w, data.h);
              ctx.strokeRect(data.x, data.y, data.w, data.h);
            } else if (data.kind === 'circle') {
              ctx.beginPath();
              ctx.arc(data.cx, data.cy, data.r, 0, Math.PI * 2);
              if (data.fill) ctx.fill();
              ctx.stroke();
            }
            ctx.restore();
          } catch (e) {
            // ignore
          }
        }
      });

      // draw tempPath if drawing
      if (tempPath && tempPath.length > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.moveTo(tempPath[0].x, tempPath[0].y);
        for (let i = 1; i < tempPath.length; i++) ctx.lineTo(tempPath[i].x, tempPath[i].y);
        ctx.stroke();
        ctx.restore();
      }

      // draw tempShape if present
      if (tempShape) {
        ctx.save();
        ctx.strokeStyle = '#0000ff';
        ctx.lineWidth = 2;
        const x = Math.min(tempShape.startX, tempShape.endX);
        const y = Math.min(tempShape.startY, tempShape.endY);
        const w = Math.abs(tempShape.endX - tempShape.startX);
        const h = Math.abs(tempShape.endY - tempShape.startY);
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
      }
    };
    img.src = currentImageUrl || imageUrl;
  }, [imageUrl, annotations, transformations, zoom]);

  // Mouse helpers and handlers
  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scale = zoom;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'draw') {
      setIsDrawing(true);
      const p = getCanvasPos(e);
      setTempPath([p]);
    } else if (selectedTool === 'shape') {
      const p = getCanvasPos(e);
      setTempShape({ startX: p.x, startY: p.y, endX: p.x, endY: p.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing && selectedTool === 'draw') {
      const p = getCanvasPos(e);
      setTempPath(prev => [...prev, p]);
    } else if (tempShape && selectedTool === 'shape') {
      const p = getCanvasPos(e);
      setTempShape({ ...tempShape, endX: p.x, endY: p.y });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && selectedTool === 'draw') {
      setIsDrawing(false);
      // commit drawing
      const newAnn: Annotation = {
        id: crypto.randomUUID(),
        type: 'draw',
        content: JSON.stringify(tempPath),
        x: 0,
        y: 0
      } as any;
      (newAnn as any).color = '#ff0000';
      (newAnn as any).width = 3;
      setAnnotations(prev => [...prev, newAnn]);
      setTempPath([]);
    } else if (tempShape && selectedTool === 'shape') {
      const shape = tempShape;
      const x = Math.min(shape.startX, shape.endX);
      const y = Math.min(shape.startY, shape.endY);
      const w = Math.abs(shape.endX - shape.startX);
      const h = Math.abs(shape.endY - shape.startY);
      const kind = Math.abs(w - h) < 20 ? 'circle' : 'rect';
      let data: any;
      if (kind === 'rect') {
        data = { kind: 'rect', x, y, w, h, stroke: '#000000', strokeWidth: 2, fill: 'transparent' };
      } else {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.max(w, h) / 2;
        data = { kind: 'circle', cx, cy, r, stroke: '#000000', strokeWidth: 2, fill: 'transparent' };
      }
      const newAnn: Annotation = {
        id: crypto.randomUUID(),
        type: 'shape',
        content: JSON.stringify(data),
        x: 0,
        y: 0
      } as any;
      setAnnotations(prev => [...prev, newAnn]);
      setTempShape(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (selectedTool === 'text') {
      const p = getCanvasPos(e);
      const text = prompt('Texto a colocar');
      if (!text) return;
      const newAnn: Annotation = {
        id: crypto.randomUUID(),
        type: 'text',
        content: text,
        x: p.x,
        y: p.y,
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000'
      } as any;
      setAnnotations(prev => [...prev, newAnn]);
    }
  };

  const [displaySize, setDisplaySize] = useState<{w:number;h:number}>({w:0,h:0});

  const clearAll = () => {
    setAnnotations([]);
    setTempPath([]);
    setTempShape(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-stretch justify-center z-50">
      <div className="bg-white w-full h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Editor de Imágenes</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAll}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Borrar todo
            </button>
            <label className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300">
              <input type="file" accept="image/*" onChange={handleLocalUpload} className="hidden" />
              <ImageIcon className="w-4 h-4" />
              Subir
            </label>
            <button
              onClick={() => setShowGallery(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              Galería
            </button>
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

          <div className="flex-1 flex overflow-hidden">
          <TransformToolbar
            selectedTool={selectedTool}
            onSelectTool={(t) => setSelectedTool(t as Tool)}
            onTransform={handleTransform}
            zoom={zoom}
          />
          <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center" ref={containerRef}>
            <div className="p-4 w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleCanvasClick}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center', background: '#fff' }}
                className="shadow-lg"
                width={displaySize.w}
                height={displaySize.h}
              />
            </div>
          </div>

          {selectedTool === 'text' && (
            <TextAnnotationPanel onAddText={handleAddText} />
          )}
        </div>
      </div>
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Galería de imágenes</h3>
              <button onClick={() => setShowGallery(false)} className="px-2 py-1 bg-gray-100 rounded">Cerrar</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {presetImages.map((p, idx) => (
                <button key={idx} onClick={() => { setCurrentImageUrl(p); setShowGallery(false); }} className="border rounded overflow-hidden">
                  <img src={p} alt={`preset-${idx}`} className="w-full h-40 object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
