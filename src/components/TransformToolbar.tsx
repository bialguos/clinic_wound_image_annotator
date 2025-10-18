import {
  MousePointer2,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Type,
  Pencil,
  Square,
  ZoomIn,
  ZoomOut,
  Contrast,
  Palette,
  Circle
} from 'lucide-react';

type TransformToolbarProps = {
  selectedTool: string;
  onSelectTool: (tool: string) => void;
  onTransform: (type: string, value?: number) => void;
  zoom: number;
  shapeType?: 'rect' | 'circle';
  onShapeTypeChange?: (type: 'rect' | 'circle') => void;
  contrast?: number;
  onContrastChange?: (value: number) => void;
  invertColors?: boolean;
  onInvertColorsToggle?: () => void;
  sharpen?: boolean;
  onSharpenToggle?: () => void;
  blur?: boolean;
  onBlurToggle?: () => void;
};

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Seleccionar' },
  { id: 'transform', icon: RotateCw, label: 'Transformar' },
  { id: 'text', icon: Type, label: 'Dibujar Texto' },
  { id: 'draw', icon: Pencil, label: 'Dibujo' },
  { id: 'shape', icon: Square, label: 'Shape' },
];

export default function TransformToolbar({
  selectedTool,
  onSelectTool,
  onTransform,
  zoom,
  shapeType = 'rect',
  onShapeTypeChange,
  contrast = 100,
  onContrastChange,
  invertColors = false,
  onInvertColorsToggle,
  sharpen = false,
  onSharpenToggle,
  blur = false,
  onBlurToggle
}: TransformToolbarProps) {
  return (
    <div className="w-56 bg-gray-50 border-r flex flex-col overflow-hidden">
      <div className="p-3 border-b bg-white flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Herramientas</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                selectedTool === tool.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <tool.icon className="w-4 h-4" />
              <span className="text-sm">{tool.label}</span>
            </button>
          ))}
        </div>

        {selectedTool === 'shape' && onShapeTypeChange && (
          <div className="p-3 border-t">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Tipo de Forma</h4>
            <div className="space-y-2">
              <button
                onClick={() => onShapeTypeChange('rect')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm border rounded transition-colors ${
                  shapeType === 'rect'
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Square className="w-4 h-4" />
                Rectángulo
              </button>
              <button
                onClick={() => onShapeTypeChange('circle')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm border rounded transition-colors ${
                  shapeType === 'circle'
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Circle className="w-4 h-4" />
                Círculo
              </button>
            </div>
          </div>
        )}

        {selectedTool === 'transform' && (
          <div className="p-3 border-t">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Transformar</h4>
            <div className="space-y-2">
              <button
                onClick={() => onTransform('rotate-90')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                Rotar 90°
              </button>
              <button
                onClick={() => onTransform('rotate-180')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                Rotar 180°
              </button>
              <button
                onClick={() => onTransform('rotate-270')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                Rotar 270°
              </button>
              <button
                onClick={() => onTransform('flip-h')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 transition-colors"
              >
                <FlipHorizontal className="w-4 h-4" />
                Voltear Horizontal
              </button>
              <button
                onClick={() => onTransform('flip-v')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 transition-colors"
              >
                <FlipVertical className="w-4 h-4" />
                Voltear Vertical
              </button>

              <div className="pt-2 border-t">
                <label className="text-xs text-gray-600 mb-1 block">Zoom</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onTransform('zoom', Math.max(0.1, zoom - 0.1))}
                    className="p-1.5 bg-white border rounded hover:bg-gray-50"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-600 flex-1 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => onTransform('zoom', Math.min(3, zoom + 0.1))}
                    className="p-1.5 bg-white border rounded hover:bg-gray-50"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 transition-colors">
                <Crop className="w-4 h-4" />
                Recortar
              </button>
            </div>

            <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase mt-4">Ajustes</h4>
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <Contrast className="w-3 h-3" />
                  Contraste: {contrast}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => onContrastChange?.(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Bajo</span>
                  <button
                    onClick={() => onContrastChange?.(100)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Reset
                  </button>
                  <span>Alto</span>
                </div>
              </div>

              <button
                onClick={onInvertColorsToggle}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm border rounded transition-colors ${
                  invertColors
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Palette className="w-4 h-4" />
                {invertColors ? 'Colores Invertidos' : 'Invertir Colores'}
              </button>
            </div>

            <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase mt-4">Efectos</h4>
            <div className="space-y-2 pb-4">
              <button
                onClick={onSharpenToggle}
                className={`w-full px-3 py-2 text-sm text-left border rounded transition-colors ${
                  sharpen
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {sharpen ? '✓ Nitidez Aplicada' : 'Ajustar Nitidez'}
              </button>
              <button
                onClick={onBlurToggle}
                className={`w-full px-3 py-2 text-sm text-left border rounded transition-colors ${
                  blur
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {blur ? '✓ Desenfoque Aplicado' : 'Desenfocar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
