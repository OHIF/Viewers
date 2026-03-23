import React, { useState, useEffect } from 'react';

const EMBED_EVENT = 'ohif:embedViewer';

interface Props {
  url: string;
  label?: string;
  icon?: string;
  tooltip?: string;
  id?: string;
}

export default function EmbeddedViewerToggleButton({ url, label, tooltip }: Props) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const embeddedUrl = (e as CustomEvent<{ url: string | null }>).detail?.url;
      setIsActive(embeddedUrl === url);
    };
    window.addEventListener(EMBED_EVENT, handler);
    return () => window.removeEventListener(EMBED_EVENT, handler);
  }, [url]);

  const handleClick = () => {
    window.dispatchEvent(
      new CustomEvent(EMBED_EVENT, { detail: { url: isActive ? null : url } })
    );
  };

  return (
    <button
      onClick={handleClick}
      title={tooltip || label}
      className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm transition-colors ${
        isActive
          ? 'bg-primary/20 text-blue-400'
          : 'text-white hover:bg-primary/10'
      }`}
    >
      <span className="flex-1 text-left">{label}</span>
      {isActive && (
        <span className="h-2 w-2 rounded-full bg-blue-400" />
      )}
    </button>
  );
}
