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
  Palette
} from 'lucide-react';

type TransformToolbarProps = {
  selectedTool: string;
  onSelectTool: (tool: string) => void;
  onTransform: (type: string, value?: number) => void;
  zoom: number;
};

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Seleccionar' },
  { id: 'transform', icon: RotateCw, label: 'Transformar' },
  { id: 'text', icon: Type, label: 'Dibujar Texto' },
  { id: 'draw', icon: Pencil, label: 'Dibujo' },
  { id: 'shape', icon: Square, label: 'Shape' },
];

export default function TransformToolbar({ selectedTool, onSelectTool, onTransform, zoom }: TransformToolbarProps) {
  return (
    <div className="w-56 bg-gray-50 border-r flex flex-col">
      <div className="p-3 border-b bg-white">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Herramientas</h3>
      </div>

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

      {selectedTool === 'transform' && (
        <div className="p-3 border-t mt-auto">
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
          <div className="space-y-2">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 transition-colors">
              <Contrast className="w-4 h-4" />
              Contraste
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded hover:bg-gray-50 transition-colors">
              <Palette className="w-4 h-4" />
              Ajustar Colores
            </button>
          </div>

          <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase mt-4">Efectos</h4>
          <div className="space-y-2">
            <button className="w-full px-3 py-2 text-sm text-left bg-white border rounded hover:bg-gray-50 transition-colors">
              Ajustar Nitidez
            </button>
            <button className="w-full px-3 py-2 text-sm text-left bg-white border rounded hover:bg-gray-50 transition-colors">
              Desenfocar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
