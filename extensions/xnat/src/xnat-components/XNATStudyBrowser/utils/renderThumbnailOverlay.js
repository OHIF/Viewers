import cornerstone from 'cornerstone-core';

const renderThumbnailOverlay = (canvas, image) => {
  if (!canvas || !image) {
    return;
  }

  const overlayPlaneMetadata = cornerstone.metaData.get(
    'overlayPlaneModule',
    image.imageId
  );

  if (
    !overlayPlaneMetadata ||
    !overlayPlaneMetadata.overlays ||
    !overlayPlaneMetadata.overlays.length
  ) {
    return;
  }

  const canvasContext = canvas.getContext('2d');

  const viewport = cornerstone.getDefaultViewport(canvas, image);

  viewport.displayedArea = image.displayedArea;

  if (!viewport.displayedArea) {
    return;
  }

  const viewportPixelSpacing = {
    column: viewport.displayedArea.columnPixelSpacing || 1,
    row: viewport.displayedArea.rowPixelSpacing || 1,
  };
  const imageWidth =
    Math.abs(viewport.displayedArea.brhc.x - viewport.displayedArea.tlhc.x) *
    viewportPixelSpacing.column;
  const imageHeight =
    Math.abs(viewport.displayedArea.brhc.y - viewport.displayedArea.tlhc.y) *
    viewportPixelSpacing.row;

  overlayPlaneMetadata.overlays.forEach(overlay => {
    if (overlay.visible === false) {
      return;
    }

    const layerCanvas = document.createElement('canvas');

    layerCanvas.width = imageWidth;
    layerCanvas.height = imageHeight;

    const layerContext = layerCanvas.getContext('2d');

    layerContext.fillStyle = overlay.fillStyle || 'white';

    if (overlay.type === 'R') {
      layerContext.fillRect(0, 0, layerCanvas.width, layerCanvas.height);
      layerContext.globalCompositeOperation = 'xor';
    }

    let i = 0;

    for (let y = 0; y < overlay.rows; y++) {
      for (let x = 0; x < overlay.columns; x++) {
        if (overlay.pixelData[i++] > 0) {
          layerContext.fillRect(x, y, 1, 1);
        }
      }
    }

    // Guard against non-number values
    const overlayX =
      !isNaN(parseFloat(overlay.x)) && isFinite(overlay.x) ? overlay.x : 0;
    const overlayY =
      !isNaN(parseFloat(overlay.y)) && isFinite(overlay.y) ? overlay.y : 0;
    // Draw the overlay layer onto the canvas

    canvasContext.drawImage(layerCanvas, overlayX, overlayY);
  });
};

export default renderThumbnailOverlay;
