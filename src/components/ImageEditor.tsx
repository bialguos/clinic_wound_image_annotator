import { useState, useRef, useEffect } from 'react';
import { X, Save, Image as ImageIcon } from 'lucide-react';
import TransformToolbar from './TransformToolbar';
import TextAnnotationPanel from './TextAnnotationPanel';
import AnnotationEditor from './AnnotationEditor';
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
  // Tamaño por defecto para el canvas
  const [displaySize, setDisplaySize] = useState<{w: number; h: number}>({ w: 800, h: 600 });
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{x: number; y: number}>({x: 0, y: 0});
  const [shapeType, setShapeType] = useState<'rect' | 'circle'>('rect');
  const [resizingHandle, setResizingHandle] = useState<string | null>(null);
  const [contrast, setContrast] = useState<number>(100); // 0-200, 100 is normal
  const [invertColors, setInvertColors] = useState<boolean>(false);
  const [sharpen, setSharpen] = useState<boolean>(false);
  const [blur, setBlur] = useState<boolean>(false);

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

  // Effect 1: Load image when URL changes
  useEffect(() => {
    const img = new Image();

    img.onerror = (err) => {
      console.error('Image load error', img.src, err);
      setLoadedImage(null);

      // Show error on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctxErr = canvas.getContext('2d');
        if (ctxErr) {
          ctxErr.clearRect(0, 0, canvas.width, canvas.height);
          ctxErr.fillStyle = '#fff';
          ctxErr.fillRect(0, 0, canvas.width, canvas.height);
          ctxErr.fillStyle = '#666';
          ctxErr.textAlign = 'center';
          ctxErr.textBaseline = 'middle';
          ctxErr.font = '16px Arial';
          ctxErr.fillText('Error cargando imagen', canvas.width / 2, canvas.height / 2);
        }
      }
    };

    img.onload = () => {
      console.log('Image loaded:', img.width, 'x', img.height);

      // Calculate display size
      const container = containerRef.current;
      let targetW = img.width;
      let targetH = img.height;

      if (container) {
        const rect = container.getBoundingClientRect();
        const maxW = rect.width - 32;
        const maxH = rect.height - 32;
        const scale = Math.min(1, Math.min(maxW / img.width, maxH / img.height));
        targetW = Math.round(img.width * scale);
        targetH = Math.round(img.height * scale);
      }

      setDisplaySize({ w: targetW, h: targetH });
      setLoadedImage(img);
    };

    console.debug('Loading image:', currentImageUrl || imageUrl);
    img.src = currentImageUrl || imageUrl;
  }, [imageUrl, currentImageUrl]);

  // Effect 2: Render canvas whenever image or annotations change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImage) return;

    // Update canvas dimensions
    canvas.width = displaySize.w;
    canvas.height = displaySize.h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations to entire canvas (image + annotations)
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

    // Draw image
    ctx.drawImage(
      loadedImage,
      0, 0,
      loadedImage.width,
      loadedImage.height,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );

    // Apply filters (contrast, color inversion, sharpen, blur) to the image
    // Need to restore transformation temporarily to get image data in normal coordinates
    if (contrast !== 100 || invertColors || sharpen || blur) {
      ctx.restore(); // Restore to get access to untransformed canvas

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;

      // Apply convolution filters first (sharpen/blur)
      if (sharpen || blur) {
        const kernel = sharpen
          ? [0, -1, 0, -1, 5, -1, 0, -1, 0] // Sharpen kernel
          : [1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9]; // Blur kernel (box blur)

        const tempData = new Uint8ClampedArray(data);
        const width = canvas.width;
        const height = canvas.height;

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) { // RGB channels only
              let sum = 0;
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                  const kernelIdx = (ky + 1) * 3 + (kx + 1);
                  sum += tempData[idx] * kernel[kernelIdx];
                }
              }
              const idx = (y * width + x) * 4 + c;
              data[idx] = Math.min(255, Math.max(0, sum));
            }
          }
        }
      }

      // Calculate contrast factor
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply contrast
        if (contrast !== 100) {
          r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
          g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
          b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
        }

        // Apply color inversion
        if (invertColors) {
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      ctx.putImageData(imageData, 0, 0);

      // Re-apply transformation for drawing annotations
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
    }

    // Draw annotations (within the same transformation context)
    // Translate annotations from canvas coordinates to centered coordinates
    annotations.forEach(annotation => {
      if (annotation.type === 'text') {
        ctx.save();
        // Adjust position: annotations are stored in canvas coordinates (0,0 at top-left)
        // but we're now centered, so subtract half canvas size
        ctx.translate(annotation.x - canvas.width / 2, annotation.y - canvas.height / 2);
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
            // Adjust all points to centered coordinates
            ctx.moveTo(pts[0].x - canvas.width / 2, pts[0].y - canvas.height / 2);
            for (let i = 1; i < pts.length; i++) {
              ctx.lineTo(pts[i].x - canvas.width / 2, pts[i].y - canvas.height / 2);
            }
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
            // Adjust position to centered coordinates
            const adjX = data.x - canvas.width / 2;
            const adjY = data.y - canvas.height / 2;
            ctx.fillRect(adjX, adjY, data.w, data.h);
            ctx.strokeRect(adjX, adjY, data.w, data.h);
          } else if (data.kind === 'circle') {
            ctx.beginPath();
            // Adjust center to centered coordinates
            const adjCx = data.cx - canvas.width / 2;
            const adjCy = data.cy - canvas.height / 2;
            ctx.arc(adjCx, adjCy, data.r, 0, Math.PI * 2);
            if (data.fill) ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        } catch (e) {
          // ignore
        }
      }
    });

    // Draw tempPath if drawing
    if (tempPath && tempPath.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      // Adjust to centered coordinates
      ctx.moveTo(tempPath[0].x - canvas.width / 2, tempPath[0].y - canvas.height / 2);
      for (let i = 1; i < tempPath.length; i++) {
        ctx.lineTo(tempPath[i].x - canvas.width / 2, tempPath[i].y - canvas.height / 2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw tempShape if present
    if (tempShape) {
      ctx.save();
      ctx.strokeStyle = '#0000ff';
      ctx.lineWidth = 2;
      const x = Math.min(tempShape.startX, tempShape.endX) - canvas.width / 2;
      const y = Math.min(tempShape.startY, tempShape.endY) - canvas.height / 2;
      const w = Math.abs(tempShape.endX - tempShape.startX);
      const h = Math.abs(tempShape.endY - tempShape.startY);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }

    // Draw selection indicator
    if (selectedAnnotationId) {
      const selectedAnn = annotations.find(a => a.id === selectedAnnotationId);
      if (selectedAnn) {
        const bounds = getAnnotationBounds(selectedAnn);
        if (bounds) {
          ctx.save();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          // Adjust to centered coordinates
          const adjX = bounds.x - canvas.width / 2;
          const adjY = bounds.y - canvas.height / 2;
          ctx.strokeRect(adjX, adjY, bounds.width, bounds.height);

          // Draw corner handles
          const handleSize = 8;
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(adjX - handleSize/2, adjY - handleSize/2, handleSize, handleSize);
          ctx.fillRect(adjX + bounds.width - handleSize/2, adjY - handleSize/2, handleSize, handleSize);
          ctx.fillRect(adjX - handleSize/2, adjY + bounds.height - handleSize/2, handleSize, handleSize);
          ctx.fillRect(adjX + bounds.width - handleSize/2, adjY + bounds.height - handleSize/2, handleSize, handleSize);

          ctx.restore();
        }
      }
    }

    // Restore the main transformation context (applied to image + all annotations)
    ctx.restore();
  }, [loadedImage, annotations, transformations, displaySize, tempPath, tempShape, selectedAnnotationId, contrast, invertColors, sharpen, blur]);

  // Mouse helpers and handlers
  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scale = zoom;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    return { x, y };
  };

  // Helper to get bounding box of an annotation
  const getAnnotationBounds = (annotation: Annotation) => {
    if (annotation.type === 'text') {
      // Approximate text bounds
      const fontSize = annotation.fontSize || 16;
      const textWidth = (annotation.content.length * fontSize * 0.6); // rough estimate
      return {
        x: annotation.x - 5,
        y: annotation.y - fontSize,
        width: textWidth + 10,
        height: fontSize + 10
      };
    }
    if (annotation.type === 'draw') {
      try {
        const pts = JSON.parse((annotation as any).content) as Array<{x:number;y:number}>;
        if (pts.length === 0) return null;
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        return { x: minX - 5, y: minY - 5, width: maxX - minX + 10, height: maxY - minY + 10 };
      } catch (e) {
        return null;
      }
    }
    if (annotation.type === 'shape') {
      try {
        const data = JSON.parse((annotation as any).content) as any;
        if (data.kind === 'rect') {
          return { x: data.x - 5, y: data.y - 5, width: data.w + 10, height: data.h + 10 };
        } else if (data.kind === 'circle') {
          return {
            x: data.cx - data.r - 5,
            y: data.cy - data.r - 5,
            width: data.r * 2 + 10,
            height: data.r * 2 + 10
          };
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  // Check if a point is inside an annotation
  const isPointInAnnotation = (x: number, y: number, annotation: Annotation): boolean => {
    const bounds = getAnnotationBounds(annotation);
    if (!bounds) return false;
    return x >= bounds.x && x <= bounds.x + bounds.width &&
           y >= bounds.y && y <= bounds.y + bounds.height;
  };

  // Find annotation at point (returns topmost/last annotation)
  const findAnnotationAtPoint = (x: number, y: number): Annotation | null => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      if (isPointInAnnotation(x, y, annotations[i])) {
        return annotations[i];
      }
    }
    return null;
  };

  // Check if point is on a resize handle
  const getResizeHandle = (x: number, y: number, bounds: {x: number; y: number; width: number; height: number} | null): string | null => {
    if (!bounds) return null;
    const handleSize = 8;
    const tolerance = 5;

    const handles = {
      'nw': { x: bounds.x, y: bounds.y },
      'ne': { x: bounds.x + bounds.width, y: bounds.y },
      'sw': { x: bounds.x, y: bounds.y + bounds.height },
      'se': { x: bounds.x + bounds.width, y: bounds.y + bounds.height }
    };

    for (const [name, pos] of Object.entries(handles)) {
      if (Math.abs(x - pos.x) <= handleSize + tolerance && Math.abs(y - pos.y) <= handleSize + tolerance) {
        return name;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const p = getCanvasPos(e);

    // Check if we're clicking on a resize handle of selected annotation
    if (selectedAnnotationId) {
      const selectedAnn = annotations.find(a => a.id === selectedAnnotationId);
      if (selectedAnn) {
        const bounds = getAnnotationBounds(selectedAnn);
        const handle = getResizeHandle(p.x, p.y, bounds);
        if (handle) {
          setResizingHandle(handle);
          return;
        }
      }
    }

    // Check if we're in select mode or clicking on an existing annotation
    if (selectedTool === 'select') {
      const clickedAnnotation = findAnnotationAtPoint(p.x, p.y);
      if (clickedAnnotation) {
        setSelectedAnnotationId(clickedAnnotation.id);
        setIsDragging(true);
        setDragOffset({ x: p.x - clickedAnnotation.x, y: p.y - clickedAnnotation.y });
      } else {
        setSelectedAnnotationId(null);
      }
      return;
    }

    // If in another tool mode and clicking on annotation, switch to select mode
    const clickedAnnotation = findAnnotationAtPoint(p.x, p.y);
    if (clickedAnnotation && selectedTool !== 'draw' && selectedTool !== 'shape' && selectedTool !== 'text') {
      setSelectedAnnotationId(clickedAnnotation.id);
      setSelectedTool('select');
      setIsDragging(true);
      setDragOffset({ x: p.x - clickedAnnotation.x, y: p.y - clickedAnnotation.y });
      return;
    }

    // Original tool behaviors
    if (selectedTool === 'draw') {
      setIsDrawing(true);
      setTempPath([p]);
    } else if (selectedTool === 'shape') {
      setTempShape({ startX: p.x, startY: p.y, endX: p.x, endY: p.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const p = getCanvasPos(e);

    // Handle resizing
    if (resizingHandle && selectedAnnotationId) {
      setAnnotations(prev => prev.map(ann => {
        if (ann.id === selectedAnnotationId && ann.type === 'shape') {
          try {
            const data = JSON.parse((ann as any).content) as any;

            if (data.kind === 'rect') {
              const bounds = getAnnotationBounds(ann);
              if (!bounds) return ann;

              let newX = data.x;
              let newY = data.y;
              let newW = data.w;
              let newH = data.h;

              // Calculate new dimensions based on which handle is being dragged
              if (resizingHandle.includes('n')) {
                newH = (bounds.y + bounds.height) - p.y;
                newY = p.y;
              }
              if (resizingHandle.includes('s')) {
                newH = p.y - bounds.y;
              }
              if (resizingHandle.includes('w')) {
                newW = (bounds.x + bounds.width) - p.x;
                newX = p.x;
              }
              if (resizingHandle.includes('e')) {
                newW = p.x - bounds.x;
              }

              // Prevent negative dimensions
              if (newW < 10) newW = 10;
              if (newH < 10) newH = 10;

              data.x = newX;
              data.y = newY;
              data.w = newW;
              data.h = newH;

              return { ...ann, content: JSON.stringify(data) };
            } else if (data.kind === 'circle') {
              const bounds = getAnnotationBounds(ann);
              if (!bounds) return ann;

              // For circle, calculate new radius from center to mouse position
              const centerX = bounds.x + bounds.width / 2;
              const centerY = bounds.y + bounds.height / 2;
              const newR = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));

              if (newR < 5) return ann; // Minimum radius

              data.r = newR;
              return { ...ann, content: JSON.stringify(data) };
            }
          } catch (e) {
            return ann;
          }
        }
        return ann;
      }));
      return;
    }

    // Handle dragging selected annotation
    if (isDragging && selectedAnnotationId) {
      setAnnotations(prev => prev.map(ann => {
        if (ann.id === selectedAnnotationId) {
          const newX = p.x - dragOffset.x;
          const newY = p.y - dragOffset.y;

          if (ann.type === 'text') {
            return { ...ann, x: newX, y: newY };
          } else if (ann.type === 'draw') {
            // Move all points in the path
            try {
              const pts = JSON.parse((ann as any).content) as Array<{x:number;y:number}>;
              const deltaX = newX - ann.x;
              const deltaY = newY - ann.y;
              const newPts = pts.map(pt => ({ x: pt.x + deltaX, y: pt.y + deltaY }));
              return { ...ann, content: JSON.stringify(newPts), x: newX, y: newY };
            } catch (e) {
              return ann;
            }
          } else if (ann.type === 'shape') {
            try {
              const data = JSON.parse((ann as any).content) as any;
              const deltaX = newX - ann.x;
              const deltaY = newY - ann.y;

              if (data.kind === 'rect') {
                data.x += deltaX;
                data.y += deltaY;
              } else if (data.kind === 'circle') {
                data.cx += deltaX;
                data.cy += deltaY;
              }
              return { ...ann, content: JSON.stringify(data), x: newX, y: newY };
            } catch (e) {
              return ann;
            }
          }
        }
        return ann;
      }));
      return;
    }

    // Original tool behaviors
    if (isDrawing && selectedTool === 'draw') {
      setTempPath(prev => [...prev, p]);
    } else if (tempShape && selectedTool === 'shape') {
      setTempShape({ ...tempShape, endX: p.x, endY: p.y });
    }
  };

  const handleMouseUp = () => {
    if (resizingHandle) {
      setResizingHandle(null);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      return;
    }

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

      let data: any;
      if (shapeType === 'rect') {
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

  // displaySize is initialized earlier; use that single state for canvas dimensions

  const clearAll = () => {
    setAnnotations([]);
    setTempPath([]);
    setTempShape(null);
    setSelectedAnnotationId(null);
    setContrast(100);
    setInvertColors(false);
    setSharpen(false);
    setBlur(false);
  };

  const handleUpdateAnnotation = (updatedAnnotation: Annotation) => {
    setAnnotations(prev => prev.map(ann =>
      ann.id === updatedAnnotation.id ? updatedAnnotation : ann
    ));
  };

  const handleDeleteAnnotation = () => {
    if (selectedAnnotationId) {
      setAnnotations(prev => prev.filter(ann => ann.id !== selectedAnnotationId));
      setSelectedAnnotationId(null);
    }
  };

  const selectedAnnotation = selectedAnnotationId
    ? annotations.find(a => a.id === selectedAnnotationId)
    : null;

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
            shapeType={shapeType}
            onShapeTypeChange={setShapeType}
            contrast={contrast}
            onContrastChange={setContrast}
            invertColors={invertColors}
            onInvertColorsToggle={() => setInvertColors(!invertColors)}
            sharpen={sharpen}
            onSharpenToggle={() => {
              setSharpen(!sharpen);
              if (!sharpen) setBlur(false); // Disable blur when enabling sharpen
            }}
            blur={blur}
            onBlurToggle={() => {
              setBlur(!blur);
              if (!blur) setSharpen(false); // Disable sharpen when enabling blur
            }}
          />
          <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center" ref={containerRef}>
            <div className="p-4 w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleCanvasClick}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center', background: '#f3f4f6', border: '1px solid #d1d5db' }}
                className="shadow-lg"
                width={displaySize.w}
                height={displaySize.h}
              />
            </div>
          </div>

          {selectedTool === 'text' && !selectedAnnotation && (
            <TextAnnotationPanel onAddText={handleAddText} />
          )}

          {selectedAnnotation && (
            <AnnotationEditor
              annotation={selectedAnnotation}
              onUpdate={handleUpdateAnnotation}
              onDelete={handleDeleteAnnotation}
            />
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
