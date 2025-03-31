import React, { useEffect, useState } from 'react';

// Define the props interface
export interface XNATThumbnailProps {
  id?: string;
  className?: string;
  imageSrc?: string;
  imageId?: string;
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
    imageSrc = '', 
    imageId = '', 
    alt = '',
    SeriesDescription = 'No Description',
    SeriesNumber = '',
    numImageFrames = 0,
    active = false,
    onClick,
    onDoubleClick,
  } = props;

  const [thumbnailImageSrc, setThumbnailImageSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  // Function to generate a placeholder color from series number
  const generatePlaceholderColor = (seriesNum: string | number): string => {
    // Convert to string and get a simple hash
    const seriesStr = seriesNum?.toString() || '';
    
    if (!seriesStr) {
      return '#cccccc'; // Default gray
    }
    
    // Simple string hash function
    let hash = 0;
    for (let i = 0; i < seriesStr.length; i++) {
      hash = ((hash << 5) - hash) + seriesStr.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Generate HSL color with moderate saturation and lightness
    // Use modulo to get values in the right range
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 60%, 80%)`;
  };

  // Create a placeholder svg for empty thumbnails
  const createPlaceholderSvg = (seriesNum: string | number): string => {
    const color = generatePlaceholderColor(seriesNum);
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100">
        <rect width="100%" height="100%" fill="${color}" />
        <text x="50%" y="50%" font-family="Arial" font-size="14" font-weight="bold" fill="#555" text-anchor="middle" dominant-baseline="middle">
          ${seriesNum || '?'}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  };

  useEffect(() => {
    console.log(`XNAT Thumbnail: Processing ${SeriesDescription}, imageId: ${imageId}`);
    
    if (imageSrc) {
      setThumbnailImageSrc(imageSrc);
    } else if (imageId) {
      try {
        // Handle dicomweb: format
        if (imageId.startsWith('dicomweb:')) {
          console.log('XNAT Thumbnail: Extracting URL from dicomweb prefix');
          // Extract the URL after the prefix
          const url = imageId.substring(9);
          
          // Create a thumbnail URL
          // For XNAT, we might need to append query parameters to request a thumbnail
          const urlObj = new URL(url);
          
          // If this is an XNAT URL, we can either:
          // 1. Use the existing URL which should return the DICOM image
          // 2. Add special query parameters if needed to request a thumbnail
          
          setThumbnailImageSrc(urlObj.toString());
          console.log('XNAT Thumbnail: Set thumbnail src to:', urlObj.toString());
        } else {
          // Regular image ID
          setThumbnailImageSrc(imageId);
        }
      } catch (error) {
        console.error('XNAT Thumbnail: Error processing imageId:', error);
        setHasError(true);
        setThumbnailImageSrc(createPlaceholderSvg(SeriesNumber));
      }
    } else {
      // No image source or ID, use placeholder
      console.log(`XNAT Thumbnail: No imageId for ${SeriesDescription}, using placeholder`);
      setHasError(true);
      setThumbnailImageSrc(createPlaceholderSvg(SeriesNumber));
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [imageId, imageSrc, SeriesDescription, SeriesNumber]);

  // Handle image load error
  const handleImageError = () => {
    console.error(`XNAT Thumbnail: Failed to load image for ${SeriesDescription}`);
    setHasError(true);
    setThumbnailImageSrc(createPlaceholderSvg(SeriesNumber));
  };

  const thumbnailClasses = [
    'thumbnail',
    active ? 'active' : '',
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
      <div className="series-details">
        <div className="series-description">{SeriesDescription}</div>
        <div className="series-info">
          {SeriesNumber !== '' && <span className="item-series">Series: {SeriesNumber}</span>}
          {numImageFrames > 0 && <span className="item-frames">{numImageFrames} frames</span>}
        </div>
      </div>
      <div className="image-thumbnail">
        {thumbnailImageSrc ? (
          <img
            className="image"
            src={thumbnailImageSrc}
            alt={alt || SeriesDescription || 'Image thumbnail'}
            onError={handleImageError}
          />
        ) : (
          <div className="image-placeholder" style={{ backgroundColor: generatePlaceholderColor(SeriesNumber) }}>
            {SeriesNumber || '?'}
          </div>
        )}
      </div>
    </div>
  );
}

export default XNATThumbnail; 