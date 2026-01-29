import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const PRESET_COLORS = [
  '#f43f5e', // coral/rose
  '#22c55e', // sage/green
  '#a855f7', // lavender/purple
  '#0ea5e9', // sky/blue
  '#eab308', // journal/yellow
  '#f97316', // orange
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#6366f1', // indigo
  '#78716c', // stone/gray
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string | undefined) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [customHex, setCustomHex] = useState('');

  useEffect(() => {
    if (value && !PRESET_COLORS.includes(value)) {
      setCustomHex(value);
    } else if (!value) {
      setCustomHex('');
    }
  }, [value]);

  const handlePresetClick = (color: string) => {
    onChange(color);
    setCustomHex('');
  };

  const handleClear = () => {
    onChange(undefined);
    setCustomHex('');
  };

  const handleCustomChange = (hex: string) => {
    setCustomHex(hex);
    // Validate hex format
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700">
        Color (optional)
      </label>

      {/* Preset colors grid */}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handlePresetClick(color)}
            className={cn(
              'w-7 h-7 rounded-full border-2 transition-all hover:scale-110',
              value === color ? 'border-gray-800 ring-2 ring-offset-1 ring-gray-400' : 'border-transparent'
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        {/* Clear button */}
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center',
            'hover:border-gray-400 hover:bg-gray-50 transition-all',
            !value && 'bg-gray-100'
          )}
          title="Clear color (use priority-based)"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>

      {/* Custom hex input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="#000000"
          value={customHex}
          onChange={(e) => handleCustomChange(e.target.value)}
          className={cn(
            'flex-1 px-2 py-1 text-sm border border-gray-200 rounded-md',
            'focus:outline-none focus:ring-1 focus:ring-lavender-500 focus:border-lavender-500'
          )}
        />
        {value && (
          <div
            className="w-7 h-7 rounded-md border border-gray-200 flex-shrink-0"
            style={{ backgroundColor: value }}
            title="Current color"
          />
        )}
      </div>

      {customHex && !/^#[0-9A-Fa-f]{6}$/.test(customHex) && (
        <p className="text-xs text-coral-500">Invalid hex format (use #RRGGBB)</p>
      )}
    </div>
  );
}
