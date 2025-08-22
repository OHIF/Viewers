import React, { useEffect, useState } from 'react';

// Define the props interface
export interface XNATThumbnailProps {
  id?: string;
  className?: string;
  imageSrc?: string | null; // Accept null for error/placeholder state
  alt?: string;
  width?: string;
  height?: string;
  SeriesDescription?: string;
  SeriesNumber?: string | number;
  numImageFrames?: number;
  instanceNumber?: number;
  active?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

function XNATThumbnail(props: XNATThumbnailProps) {
  const {
    id,
    className,
    imageSrc, // Use imageSrc directly (can be null)
    alt = '',
    SeriesDescription = 'No Description',
    SeriesNumber = '',
    numImageFrames = 0,
    active = false,
    onClick,
    onDoubleClick,
  } = props;

  // State to track if the provided imageSrc (or fallback) failed to render in the <img>
  const [renderError, setRenderError] = useState(false);

  // Function to generate a placeholder color from series number
  const generatePlaceholderColor = (seriesNum: string | number): string => {
    const seriesStr = seriesNum?.toString() || '';
    if (!seriesStr) {
      return '#cccccc'; // Default gray
    }
    let hash = 0;
    for (let i = 0; i < seriesStr.length; i++) {
      hash = ((hash << 5) - hash) + seriesStr.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 60%, 80%)`;
  };

  // Create a placeholder svg for empty thumbnails
  const createPlaceholderSvg = (seriesNum: string | number): string => {
    const color = generatePlaceholderColor(seriesNum);
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100">
        <rect width="100%" height="100%" fill="${color}" />
        <text x="50%" y="50%" font-family="Arial" font-size="14" font-weight="bold" fill="#7bb2ce" text-anchor="middle" dominant-baseline="middle">
          ${seriesNum || '?'}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  };

  // Reset render error state if imageSrc prop changes
  useEffect(() => {
    setRenderError(false);
  }, [imageSrc]);

  // Handle image load error for the <img> tag
  const handleImageError = () => {
    if (!renderError) {
      console.error(`XNAT Thumbnail: Error rendering image src for ${SeriesDescription}`);
      setRenderError(true); // Set render error state
    }
  };

  // Determine final source: use imageSrc if available and no render error, otherwise use placeholder
  const finalImageSrc = !renderError && imageSrc ? imageSrc : createPlaceholderSvg(SeriesNumber);

  const thumbnailClasses = [
    'w-40 bg-card rounded overflow-hidden transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5',
    active ? 'border-2 border-primary' : '',
    renderError || !imageSrc ? 'border-destructive' : '',
    className || '',
  ].join(' ');

  return (
    <div
      id={id}
      className={thumbnailClasses}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      data-cy="thumbnail"
    >
      <div className="p-2">
        <div className="text-xs font-bold text-aqua-pale whitespace-nowrap overflow-hidden text-ellipsis mb-1">
          {SeriesDescription}
        </div>
        <div className="flex justify-between text-xs text-aqua-pale/70">
          {SeriesNumber !== '' && <span>Series: {SeriesNumber}</span>}
          {numImageFrames > 0 && <span>{numImageFrames} frames</span>}
        </div>
      </div>
      <div className="h-24 flex items-center justify-center bg-black relative">
        <img
          className="max-w-full max-h-full object-contain"
          src={finalImageSrc} // Use finalImageSrc (data URL or placeholder SVG)
          alt={alt || SeriesDescription || 'Image thumbnail'}
          onError={handleImageError} // Use the handler to set renderError state
        />
      </div>
    </div>
  );
}

export default XNATThumbnail; 