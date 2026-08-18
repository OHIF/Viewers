import React, { useEffect, useRef, useState } from 'react';
import { Enums } from '@cornerstonejs/core';
import { parseSegToMaskArray, loadSegFromImageId } from '../utils/segParser';

interface CustomSegmentationOverlayProps {
  viewportId: string;
  segImageId?: string;
}

/**
 * Custom SEG Overlay Component
 * Renders segmentation masks directly on canvas, bypassing OHIF's rendering pipeline
 */
export const CustomSegmentationOverlay: React.FC<CustomSegmentationOverlayProps> = ({
  viewportId,
  segImageId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [maskArray, setMaskArray] = useState<number[][][] | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 512, height: 512 });
  const [activeSegDisplaySetUID, setActiveSegDisplaySetUID] = useState<string | null>(null);

  // Listen for SEG_LOADED event from loadCustomSEG command
  useEffect(() => {
    const handleSEGLoaded = (event: CustomEvent) => {
      console.log('CustomOverlay: Received SEG_LOADED event:', event.detail);
      const { segDisplaySetUID } = event.detail;
      setActiveSegDisplaySetUID(segDisplaySetUID);
    };

    window.addEventListener('SEG_LOADED', handleSEGLoaded as EventListener);

    return () => {
      window.removeEventListener('SEG_LOADED', handleSEGLoaded as EventListener);
    };
  }, []);

  // Load SEG file when activeSegDisplaySetUID changes
  useEffect(() => {
    if (!activeSegDisplaySetUID) return;

    const loadSegFromDisplaySet = async () => {
      try {
        console.log('CustomOverlay: Loading SEG from display set UID:', activeSegDisplaySetUID);
        
        // Get the display set service from window (OHIF services)
        const servicesManager = (window as any).__servicesManager;
        if (!servicesManager) {
          console.error('CustomOverlay: servicesManager not found on window');
          return;
        }

        const displaySetService = servicesManager.services?.displaySetService;
        if (!displaySetService) {
          console.error('CustomOverlay: displaySetService not found');
          return;
        }

        // Get the SEG display set
        const segDisplaySet = displaySetService.getDisplaySetByUID(activeSegDisplaySetUID);
        if (!segDisplaySet) {
          console.error('CustomOverlay: SEG display set not found:', activeSegDisplaySetUID);
          return;
        }

        console.log('CustomOverlay: Found SEG display set:', segDisplaySet);

        // Get the first image ID from the display set
        const imageId = segDisplaySet.images?.[0]?.imageId;
        if (!imageId) {
          console.error('CustomOverlay: No imageId found in SEG display set');
          return;
        }

        console.log('CustomOverlay: Loading SEG from imageId:', imageId);
        const mask = await loadSegFromImageId(imageId);
        setMaskArray(mask);
        
        if (mask.length > 0 && mask[0].length > 0) {
          setDimensions({
            width: mask[0][0].length,
            height: mask[0].length,
          });
          console.log('CustomOverlay: SEG loaded successfully, dimensions:', { width: mask[0][0].length, height: mask[0].length });
        }
      } catch (error) {
        console.error('CustomOverlay: Failed to load SEG:', error);
      }
    };

    loadSegFromDisplaySet();
  }, [activeSegDisplaySetUID]);

  // Listen to stack change events to update current frame
  useEffect(() => {
    const handleStackChange = (event: CustomEvent) => {
      const { imageId } = event.detail;
      console.log('CustomOverlay: Stack changed to imageId:', imageId);
      
      // Extract frame index from imageId if possible
      // This depends on your imageId format
      const frameMatch = imageId.match(/frame=(\d+)/);
      if (frameMatch) {
        const frameIndex = parseInt(frameMatch[1], 10);
        setCurrentFrameIndex(frameIndex);
        console.log('CustomOverlay: Frame index:', frameIndex);
      }
    };

    // Subscribe to cornerstone events
    const eventTarget = (window as any).cornerstone?.eventTarget;
    if (eventTarget) {
      eventTarget.addEventListener(Enums.Events.STACK_NEW_IMAGE, handleStackChange as EventListener);
    }

    return () => {
      if (eventTarget) {
        eventTarget.removeEventListener(Enums.Events.STACK_NEW_IMAGE, handleStackChange as EventListener);
      }
    };
  }, []);

  // Draw current frame mask to canvas
  useEffect(() => {
    if (!maskArray || !canvasRef.current || currentFrameIndex >= maskArray.length) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Get current frame mask
    const currentMask = maskArray[currentFrameIndex];
    if (!currentMask) return;

    // Create image data
    const imageData = ctx.createImageData(dimensions.width, dimensions.height);
    const data = imageData.data;

    // Fill with transparent red for mask pixels
    for (let row = 0; row < currentMask.length; row++) {
      for (let col = 0; col < currentMask[row].length; col++) {
        const pixelIndex = (row * dimensions.width + col) * 4;
        
        if (currentMask[row][col] === 1) {
          // Red with 50% opacity
          data[pixelIndex] = 255;     // R
          data[pixelIndex + 1] = 0;   // G
          data[pixelIndex + 2] = 0;   // B
          data[pixelIndex + 3] = 128; // A (50% opacity)
        } else {
          // Transparent
          data[pixelIndex] = 0;
          data[pixelIndex + 1] = 0;
          data[pixelIndex + 2] = 0;
          data[pixelIndex + 3] = 0;
        }
      }
    }

    // Draw to canvas
    ctx.putImageData(imageData, 0, 0);
    console.log('CustomOverlay: Drew frame', currentFrameIndex);
  }, [maskArray, currentFrameIndex, dimensions]);

  if (!segImageId) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Let clicks pass through to CT image
        zIndex: 1000,
      }}
    />
  );
};
