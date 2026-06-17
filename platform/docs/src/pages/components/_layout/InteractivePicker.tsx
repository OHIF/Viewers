import React, { useState } from 'react';

export interface PickerOption {
  value: string;
  label: string;
  description: string;
}

interface InteractivePickerProps {
  options: PickerOption[];
  defaultValue?: string;
  renderPreview: (activeValue: string) => React.ReactNode;
}

export default function InteractivePicker({
  options,
  defaultValue,
  renderPreview,
}: InteractivePickerProps) {
  const [active, setActive] = useState(defaultValue || options[0]?.value || '');
  const activeOption = options.find(o => o.value === active);

  return (
    <div className="overflow-hidden rounded-lg border border-input/50">
      <div className="flex flex-wrap gap-1 border-b border-input/50 bg-muted/40 px-3 py-2">
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => setActive(o.value)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              active === o.value
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="flex min-h-[160px] items-center justify-center bg-muted/10 p-8">
        {renderPreview(active)}
      </div>
      <div className="border-t border-input/50 bg-muted/20 px-4 py-3">
        <p className="text-lg text-muted-foreground">
          <span className="font-mono text-xs text-highlight">{active}</span>
          {' — '}
          {activeOption?.description}
        </p>
      </div>
    </div>
  );
}
