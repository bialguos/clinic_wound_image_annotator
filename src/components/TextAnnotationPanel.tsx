import { useState } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

type TextAnnotationPanelProps = {
  onAddText: (
    text: string,
    fontSize: number,
    fontFamily: string,
    fontWeight: string,
    fontStyle: string,
    textDecoration: string,
    color: string,
    rotation: number
  ) => void;
};

export default function TextAnnotationPanel({ onAddText }: TextAnnotationPanelProps) {
  const [text, setText] = useState('Su texto aquí...');
  const [fontSize, setFontSize] = useState(36);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [color, setColor] = useState('#000000');
  const [horizontalPosition, setHorizontalPosition] = useState(0);
  const [verticalPosition, setVerticalPosition] = useState(0);
  const [rotation, setRotation] = useState(0);

  const handleAddText = () => {
    onAddText(
      text,
      fontSize,
      fontFamily,
      isBold ? 'bold' : 'normal',
      isItalic ? 'italic' : 'normal',
      isUnderline ? 'underline' : 'none',
      color,
      rotation
    );
  };

  const handleReset = () => {
    setText('Su texto aquí...');
    setFontSize(36);
    setFontFamily('Arial');
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setColor('#000000');
    setHorizontalPosition(0);
    setVerticalPosition(0);
    setRotation(0);
  };

  return (
    <div className="w-64 bg-gray-50 border-l p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Dibujar Texto</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Texto</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tamaño de Fuente</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              step="1"
              min="8"
              max="200"
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="range"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min="8"
              max="200"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Familia de fuentes</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Estilo de fuente</label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsBold(!isBold)}
              className={`flex-1 flex items-center justify-center p-2 border rounded transition-colors ${
                isBold ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsItalic(!isItalic)}
              className={`flex-1 flex items-center justify-center p-2 border rounded transition-colors ${
                isItalic ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsUnderline(!isUnderline)}
              className={`flex-1 flex items-center justify-center p-2 border rounded transition-colors ${
                isUnderline ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Underline className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Color del Texto</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-9 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Posición Horizontal</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={horizontalPosition}
              onChange={(e) => setHorizontalPosition(Number(e.target.value))}
              step="0.01"
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="range"
              value={horizontalPosition}
              onChange={(e) => setHorizontalPosition(Number(e.target.value))}
              min="-500"
              max="500"
              step="1"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Posición Vertical</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={verticalPosition}
              onChange={(e) => setVerticalPosition(Number(e.target.value))}
              step="0.01"
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="range"
              value={verticalPosition}
              onChange={(e) => setVerticalPosition(Number(e.target.value))}
              min="-500"
              max="500"
              step="1"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Rotación</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              step="0.01"
              min="-360"
              max="360"
              className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="range"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              min="-360"
              max="360"
              step="1"
              className="flex-1"
            />
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <button
            onClick={handleAddText}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Añadir Texto
          </button>
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Resetear
          </button>
        </div>
      </div>
    </div>
  );
}
