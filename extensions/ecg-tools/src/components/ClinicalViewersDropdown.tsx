import React, { useState, useRef, useEffect } from 'react';

const VIEWERS = [
  { label: 'ECG Viewer', path: '/ecg-viewer' },
  { label: 'Footprint', path: '/flatfoot' },
  { label: 'Smart Paint', path: '/smart-paint' },
];

export default function ClinicalViewersDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        onClick={() => setOpen(o => !o)}
        title="Clinical Viewers"
        className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors
          ${open
            ? 'bg-primary text-black'
            : 'text-white hover:bg-primary/20'
          }`}
      >
        {/* simple grid icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="6" height="6" rx="1"/>
          <rect x="9" y="1" width="6" height="6" rx="1"/>
          <rect x="1" y="9" width="6" height="6" rx="1"/>
          <rect x="9" y="9" width="6" height="6" rx="1"/>
        </svg>
        <span>Tools</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M2 3.5 L5 6.5 L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-[9999] mt-1 min-w-[160px] overflow-hidden rounded border border-secondary-light bg-secondary-dark shadow-xl">
          {VIEWERS.map(v => (
            <button
              key={v.path}
              onClick={() => {
                setOpen(false);
                window.open(v.path, '_self');
              }}
              className="flex w-full items-center px-3 py-2 text-left text-sm text-white hover:bg-primary/20 active:bg-primary/30"
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
