import { metaData, StackViewport, Types } from '@cornerstonejs/core';
import { utilities } from '@cornerstonejs/core';
import { BaseTool } from '@cornerstonejs/tools';
import { guid } from '@ohif/core/src/utils';

interface CachedStat {
  color: number[];
  overlays: (unknown & {
    _id: string;
    pixelDataRaw: ArrayBuffer;
    type: 'G' | 'R';
  })[];
}

/**
 * Image Overlay Viewer tool is not a traditional tool that requires user interactin.
 * But it is used to display Pixel Overlays. And it will provide toggling capability.
 *
 * The documentation for Overlay Plane Module of DICOM can be found in [C.9.2 of
 * Part-3 of DICOM standard](https://dicom.nema.org/medical/dicom/2018b/output/chtml/part03/sect_C.9.2.html)
 */
class ImageOverlayViewerTool extends BaseTool {
  static toolName = 'ImageOverlayViewer';

  _renderingViewport: any;
  _cachedStats: { [key: string]: CachedStat } = {};

  constructor(
    toolProps = {},
    defaultToolProps = {
      supportedInteractionTypes: [],
      configuration: {
        showOverlays: true,
        fillColor: [255, 127, 127, 255],
      },
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  private _getCachedStat(targetId: string, createIfMissing = true): CachedStat {
    if (!this._cachedStats[targetId] && createIfMissing)
      this._cachedStats[targetId] = {
        color: [127, 127, 127, 255], // color (r,g,b,a), default color: gray
        overlays: [],
      };
    return this._cachedStats[targetId];
  }

  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    // overlays are toggled off by configuration
    if (!this.configuration.showOverlays) return false;

    const { viewport } = enabledElement;
    this._renderingViewport = viewport;

    const imageId = this._getReferencedImageId(viewport);
    if (!imageId) return;

    const targetId = this.getTargetId(viewport);
    const cachedStat = this._getCachedStat(targetId);

    let overlays;
    ({ overlays } = metaData.get('overlayPlaneModule', imageId));
    overlays = overlays.filter(overlay => overlay.type === 'G');

    // no overlays
    if (!overlays || overlays.length <= 0) return;

    overlays.forEach(async (overlay, idx) => {
      try {
        if (!cachedStat.overlays[idx]) {
          // first time load? let's load data
          if (overlay.pixelData) {
            let pixelData = null;
            if (overlay.pixelData.Value) {
              pixelData = overlay.pixelData.Value;
            } else if (overlay.pixelData.retrieveBulkData) {
              pixelData = await overlay.pixelData.retrieveBulkData();
            }

            if (pixelData) {
              cachedStat.overlays[idx] = {
                ...overlay,
                pixelDataRaw: pixelData, // this will be an ArrayBuffer object
                _id: guid(),
              };
            }
          }
        }

        if (cachedStat.overlays[idx]) {
          this._renderOverlay(
            enabledElement,
            svgDrawingHelper,
            cachedStat.overlays[idx]
          );
        }
      } catch (e) {
        console.error('Failed to render overlay', e);
      }
    });

    return true;
  };

  private _renderOverlay(enabledElement, svgDrawingHelper, overlayData) {
    if (
      !overlayData.color ||
      this.configuration.fillColor != overlayData.color
    ) {
      // pixelData of overlayPlane module is an array of bits corresponding
      // to each of the underlying pixels of the image.
      // let's create pixel data from bit array of overlay data
      const { pixelDataRaw, rows: height, columns: width } = overlayData;
      const pixelDataView = new DataView(pixelDataRaw);
      const totalBits = width * height;
      const color = this.configuration.fillColor;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height); // make it transparent
      ctx.globalCompositeOperation = 'copy';
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0, bitIdx = 0, byteIdx = 0; i < totalBits; i++) {
        if (pixelDataView.getUint8(byteIdx) & (1 << bitIdx)) {
          data[i * 4] = color[0];
          data[i * 4 + 1] = color[1];
          data[i * 4 + 2] = color[2];
          data[i * 4 + 3] = color[3];
        }

        // next bit, byte
        if (bitIdx >= 7) {
          bitIdx = 0;
          byteIdx++;
        } else {
          bitIdx++;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // this also works as a flag and identifier of cached pixelated overlay image.
      overlayData.color = color;
      overlayData.dataUrl = canvas.toDataURL();
    }

    const { viewport } = enabledElement;
    const imageId = this._getReferencedImageId(viewport);
    if (!imageId) return;

    // Decide the rendering position of the overlay image on the current canvas
    const { _id, columns: width, rows: height, x, y } = overlayData;
    const overlayTopLeftWorldPos = utilities.imageToWorldCoords(imageId, [
      x - 1, // Remind that top-left corner's (x, y) is be (1, 1)
      y - 1,
    ]);
    const overlayTopLeftOnCanvas = viewport.worldToCanvas(
      overlayTopLeftWorldPos
    );
    const overlayBottomRightWorldPos = utilities.imageToWorldCoords(imageId, [
      width,
      height,
    ]);
    const overlayBottomRightOnCanvas = viewport.worldToCanvas(
      overlayBottomRightWorldPos
    );

    // add image to the annotations svg layer
    const svgns = 'http://www.w3.org/2000/svg';
    const svgNodeHash = `image-overlay-${_id}`;
    const existingImageElement = svgDrawingHelper.getSvgNode(svgNodeHash);

    const attributes = {
      'data-id': svgNodeHash,
      width: overlayBottomRightOnCanvas[0] - overlayTopLeftOnCanvas[0],
      height: overlayBottomRightOnCanvas[1] - overlayTopLeftOnCanvas[1],
      x: overlayTopLeftOnCanvas[0],
      y: overlayTopLeftOnCanvas[1],
      href: overlayData.dataUrl,
    };

    if (
      isNaN(attributes.x) ||
      isNaN(attributes.y) ||
      isNaN(attributes.width) ||
      isNaN(attributes.height)
    ) {
      console.warn(
        'Invalid rendering attribute for image overlay',
        attributes['data-id']
      );
      return false;
    }
    console.log(
      'rendering overlay image with attributes',
      attributes['data-id']
    );

    if (existingImageElement) {
      _setAttributesIfNecessary(attributes, existingImageElement);
      svgDrawingHelper.setNodeTouched(svgNodeHash);
    } else {
      const newImageElement = document.createElementNS(svgns, 'image');
      _setNewAttributesIfValid(attributes, newImageElement);
      svgDrawingHelper.appendNode(newImageElement, svgNodeHash);
    }
    return true;
  }

  /**
   * Get viewport's referene image id,
   * TODO: maybe we should add this to the BaseTool or AnnotationTool class
   * as it is often used by tools.
   *
   * @param viewport
   * @returns
   */
  private _getReferencedImageId(
    viewport: Types.IStackViewport | Types.IVolumeViewport
  ): string {
    const targetId = this.getTargetId(viewport);

    let referencedImageId;

    if (viewport instanceof StackViewport) {
      referencedImageId = targetId.split('imageId:')[1];
    }

    return referencedImageId;
  }
}

function _setAttributesIfNecessary(attributes, svgNode: SVGElement) {
  Object.keys(attributes).forEach(key => {
    const currentValue = svgNode.getAttribute(key);
    const newValue = attributes[key];
    if (newValue === undefined || newValue === '') {
      svgNode.removeAttribute(key);
    } else if (currentValue !== newValue) {
      svgNode.setAttribute(key, newValue);
    }
  });
}

function _setNewAttributesIfValid(attributes, svgNode: SVGElement) {
  Object.keys(attributes).forEach(key => {
    const newValue = attributes[key];
    if (newValue !== undefined && newValue !== '') {
      svgNode.setAttribute(key, newValue);
    }
  });
}

export default ImageOverlayViewerTool;
