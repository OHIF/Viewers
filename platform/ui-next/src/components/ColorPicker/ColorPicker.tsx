import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../Button';
import { Icons } from '../Icons';
import { ScrollArea } from '../ScrollArea';

const STORAGE_KEY = 'ohif-theme-colors';

// Default CSS variables combining ui-next and ui tailwind configs
const DEFAULT_CSS_VARIABLES: Record<string, string> = {
  // ui-next theme variables (HSL format)
  '--highlight': '191 74% 63%',
  '--neutral': '213 22% 59%',
  '--neutral-light': '214 69% 81%',
  '--neutral-dark': '214 16% 21%',
  '--background': '236 62% 5%',
  '--foreground': '0 0% 98%',
  '--card': '234 64% 10%',
  '--card-foreground': '0 0% 98%',
  '--popover': '219 90% 15%',
  '--popover-foreground': '0 0% 98%',
  '--primary': '214 98% 60%',
  '--primary-foreground': '0 0% 98%',
  '--secondary': '214 66% 48%',
  '--secondary-foreground': '200 50% 84%',
  '--muted': '234 64% 10%',
  '--muted-foreground': '200 46% 65%',
  '--accent': '217 79% 24%',
  '--accent-foreground': '0 0% 98%',
  '--destructive': '0 62.8% 30.6%',
  '--destructive-foreground': '0 0% 98%',
  '--border': '0 0% 14.9%',
  '--input': '236 52% 30%',
  '--ring': '214 98% 60%',
  '--chart-1': '220 70% 50%',
  '--chart-2': '160 60% 45%',
  '--chart-3': '30 80% 55%',
  '--chart-4': '280 65% 60%',
  '--chart-5': '340 75% 55%',

  // ui tailwind colors (converted to HSL for CSS vars)
  // Primary colors
  '--primary-light': '187 74% 63%', // #5acce6
  '--primary-main': '220 91% 37%', // #0944b3
  '--primary-dark': '233 64% 10%', // #090c29
  '--primary-active': '213 98% 60%', // #348cfd

  // Secondary colors
  '--secondary-light': '235 45% 42%', // #3a3f99
  '--secondary-main': '259 63% 25%', // #2b166b
  '--secondary-dark': '217 91% 15%', // #041c4a
  '--secondary-active': '240 15% 14%', // #1f1f27

  // Common colors
  '--common-bright': '0 0% 88%', // #e1e1e1
  '--common-light': '260 6% 66%', // #a19fad
  '--common-main': '0 0% 100%', // #fff
  '--common-dark': '264 6% 46%', // #726f7e
  '--common-active': '234 45% 31%', // #2c3074

  // Background colors
  '--bkg-low': '244 76% 4%', // #050615
  '--bkg-med': '233 64% 10%', // #090C29
  '--bkg-full': '217 91% 15%', // #041C4A

  // Actions
  '--actions-primary': '213 98% 60%', // #348CFD
  '--actions-highlight': '187 74% 63%', // #5ACCE6

  // Info colors
  '--info-primary': '0 0% 100%', // #FFFFFF
  '--info-secondary': '199 39% 65%', // #7BB2CE

  // Inputfield colors
  '--inputfield-main': '235 45% 42%', // #3a3f99
  '--inputfield-disabled': '259 63% 25%', // #2b166b
  '--inputfield-focus': '187 74% 63%', // #5acce6
  '--inputfield-placeholder': '270 5% 24%', // #39383f

  // Custom colors
  '--customgreen-100': '155 96% 43%', // #05D97C
  '--customgreen-200': '155 88% 45%', // #0FD97C
  '--customblue-10': '224 77% 14%', // #0A163F
  '--customblue-20': '220 77% 19%', // #0B1F54
  '--customblue-30': '220 82% 24%', // #09286e
  '--customblue-40': '220 80% 28%', // #0E307F
  '--customblue-50': '220 82% 32%', // #0F3A94
  '--customblue-80': '220 86% 46%', // #1454D4
  '--customblue-100': '181 100% 88%', // #c4fdff
  '--customblue-200': '193 100% 61%', // #38daff
  '--customblue-300': '235 45% 21%', // #1D204D
  '--customblue-400': '218 31% 66%', // #90A0C1
  '--customgray-100': '235 28% 21%', // #262943
  '--indigo-dark': '220 73% 15%', // #0b1a42

  // Aqua
  '--aqua-pale': '199 39% 65%', // #7bb2ce
};

// Convert HSL string (without hsl() wrapper) to hex
function hslToHex(hslString: string): string {
  const parts = hslString.trim().split(/\s+/);
  if (parts.length < 3) {
    return '#000000';
  }

  const h = parseFloat(parts[0]) || 0;
  const s = (parseFloat(parts[1]) || 0) / 100;
  const l = (parseFloat(parts[2]) || 0) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert hex to HSL string (without hsl() wrapper)
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return '0 0% 0%';
  }

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Apply CSS variables to the document root
function applyCssVariables(variables: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

// Load saved colors from localStorage
function loadSavedColors(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_CSS_VARIABLES, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load saved colors:', e);
  }
  return { ...DEFAULT_CSS_VARIABLES };
}

// Save colors to localStorage
function saveColors(colors: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch (e) {
    console.error('Failed to save colors:', e);
  }
}

interface ColorBoxProps {
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
}

function ColorBox({ name, value, onChange }: ColorBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localHex, setLocalHex] = useState(() => hslToHex(value));
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update local hex when value changes from outside
  useEffect(() => {
    setLocalHex(hslToHex(value));
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value;
    setLocalHex(newHex);

    // Debounce the actual update to prevent lag
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      const newHsl = hexToHsl(newHex);
      onChange(name, newHsl);
    }, 16); // ~60fps
  };

  const handleBoxClick = () => {
    inputRef.current?.click();
  };

  const displayName = name.replace('--', '');

  return (
    <div className="flex items-center gap-2 py-1">
      <div
        className="h-6 w-6 flex-shrink-0 cursor-pointer rounded border border-white/20 transition-transform hover:scale-110"
        style={{ backgroundColor: localHex }}
        onClick={handleBoxClick}
        title={`Click to change ${displayName}`}
      />
      <input
        ref={inputRef}
        type="color"
        value={localHex}
        onChange={handleColorChange}
        className="sr-only"
      />
      <span className="text-foreground truncate text-xs">{displayName}</span>
    </div>
  );
}

// Group colors by category
function groupColors(colors: Record<string, string>): Record<string, Record<string, string>> {
  const groups: Record<string, Record<string, string>> = {
    'Theme Core': {},
    Primary: {},
    Secondary: {},
    Background: {},
    Common: {},
    Actions: {},
    Input: {},
    Charts: {},
    Custom: {},
  };

  Object.entries(colors).forEach(([key, value]) => {
    if (
      key.includes('primary') &&
      !key.includes('actions') &&
      !key.includes('info') &&
      !key.includes('foreground')
    ) {
      groups['Primary'][key] = value;
    } else if (key.includes('secondary') && !key.includes('foreground') && !key.includes('info')) {
      groups['Secondary'][key] = value;
    } else if (key.includes('bkg') || key === '--background') {
      groups['Background'][key] = value;
    } else if (key.includes('common')) {
      groups['Common'][key] = value;
    } else if (key.includes('actions')) {
      groups['Actions'][key] = value;
    } else if (key.includes('input') || key.includes('inputfield')) {
      groups['Input'][key] = value;
    } else if (key.includes('chart')) {
      groups['Charts'][key] = value;
    } else if (
      key.includes('custom') ||
      key.includes('aqua') ||
      key.includes('indigo') ||
      key.includes('green')
    ) {
      groups['Custom'][key] = value;
    } else {
      groups['Theme Core'][key] = value;
    }
  });

  return groups;
}

export function ColorPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [colors, setColors] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      return loadSavedColors();
    }
    return { ...DEFAULT_CSS_VARIABLES };
  });

  // Dialog position and size state
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 450, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);

  // Apply colors on mount and when they change
  useEffect(() => {
    applyCssVariables(colors);
  }, [colors]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadSavedColors();
    setColors(saved);
    applyCssVariables(saved);
  }, []);

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
      if (isResizing) {
        const newWidth = Math.max(350, e.clientX - position.x);
        const newHeight = Math.max(300, e.clientY - position.y);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleColorChange = useCallback((name: string, value: string) => {
    setColors(prev => {
      const updated = { ...prev, [name]: value };
      // Apply immediately for real-time update
      document.documentElement.style.setProperty(name, value);
      // Save debounced
      saveColors(updated);
      return updated;
    });
  }, []);

  const handleReset = useCallback(() => {
    setColors({ ...DEFAULT_CSS_VARIABLES });
    saveColors(DEFAULT_CSS_VARIABLES);
    applyCssVariables(DEFAULT_CSS_VARIABLES);
  }, []);

  const handleExportJson = useCallback(() => {
    const json = JSON.stringify(colors, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ohif-theme-colors.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [colors]);

  const handleImportJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const imported = JSON.parse(text);
          if (typeof imported === 'object' && imported !== null) {
            const merged = { ...DEFAULT_CSS_VARIABLES, ...imported };
            setColors(merged);
            saveColors(merged);
            applyCssVariables(merged);
          }
        } catch (err) {
          console.error('Failed to import JSON:', err);
          alert('Failed to import JSON file. Please check the file format.');
        }
      }
    };
    input.click();
  }, []);

  const groupedColors = groupColors(colors);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-primary hover:bg-primary/25 ml-2"
        title="Theme Color Picker"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Icons.ColorChange className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div
          ref={dialogRef}
          className="fixed z-[9999] rounded-lg border border-white/20 bg-[#0a1628] shadow-2xl"
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
          }}
        >
          {/* Header - Draggable */}
          <div
            className="flex cursor-move items-center justify-between border-b border-white/10 bg-[#0d1f3c] px-4 py-3"
            onMouseDown={handleDragStart}
          >
            <div>
              <h3 className="text-sm font-medium text-white">Theme Color Picker</h3>
              <p className="mt-0.5 text-xs text-gray-400">Drag to move, resize from corner</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <Icons.Close className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea
            className="p-4"
            style={{ height: size.height - 120 }}
          >
            {Object.entries(groupedColors).map(
              ([group, groupVars]) =>
                Object.keys(groupVars).length > 0 && (
                  <div
                    key={group}
                    className="mb-4"
                  >
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {group}
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {Object.entries(groupVars).map(([name, value]) => (
                        <ColorBox
                          key={name}
                          name={name}
                          value={value}
                          onChange={handleColorChange}
                        />
                      ))}
                    </div>
                  </div>
                )
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 flex gap-2 border-t border-white/10 bg-[#0d1f3c] p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1 text-xs"
            >
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImportJson}
              className="flex-1 text-xs"
            >
              Import
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExportJson}
              className="flex-1 text-xs"
            >
              Export JSON
            </Button>
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
            onMouseDown={handleResizeStart}
          >
            <svg
              className="h-4 w-4 text-gray-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
            </svg>
          </div>
        </div>
      )}
    </>
  );
}

export default ColorPicker;
