import { VolumeViewport, metaData, utilities } from '@cornerstonejs/core';
import { IStackViewport, IVolumeViewport, Point3 } from '@cornerstonejs/core/dist/esm/types';
import { AnnotationDisplayTool, drawing } from '@cornerstonejs/tools';
import { guid, b64toBlob } from '@ohif/core/src/utils';
import OverlayPlaneModuleProvider from './OverlayPlaneModuleProvider';

interface CachedStat {
  color: number[]; // [r, g, b, a]
  overlays: {
    // ...overlayPlaneModule
    _id: string;
    type: 'G' | 'R'; // G for Graphics, R for ROI
    color?: number[]; // Rendered color [r, g, b, a]
    dataUrl?: string; // Rendered image in Data URL expression
  }[];
}

/**
 * Image Overlay Viewer tool is not a traditional tool that requires user interactin.
 * But it is used to display Pixel Overlays. And it will provide toggling capability.
 *
 * The documentation for Overlay Plane Module of DICOM can be found in [C.9.2 of
 * Part-3 of DICOM standard](https://dicom.nema.org/medical/dicom/2018b/output/chtml/part03/sect_C.9.2.html)
 *
 * Image Overlay rendered by this tool can be toggled on and off using
 * toolGroup.setToolEnabled() and toolGroup.setToolDisabled()
 */
class ImageOverlayViewerTool extends AnnotationDisplayTool {
  static toolName = 'ImageOverlayViewer';

  /**
   * The overlay plane module provider add method is exposed here to be used
   * when updating the overlay for this tool to use for displaying data.
   */
  public static addOverlayPlaneModule = OverlayPlaneModuleProvider.add;

  constructor(
    toolProps = {},
    defaultToolProps = {
      supportedInteractionTypes: [],
      configuration: {
        fillColor: [255, 127, 127, 255],
      },
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  onSetToolDisabled = (): void => {};

  protected getReferencedImageId(viewport: IStackViewport | IVolumeViewport): string {
    if (viewport instanceof VolumeViewport) {
      return;
    }

    const targetId = this.getTargetId(viewport);
    return targetId.split('imageId:')[1];
  }

  renderAnnotation = (enabledElement, svgDrawingHelper) => {
    const { viewport } = enabledElement;

    const imageId = this.getReferencedImageId(viewport);
    if (!imageId) {
      return;
    }

    const overlayMetadata = metaData.get('overlayPlaneModule', imageId);
    const overlays = overlayMetadata?.overlays;

    // no overlays
    if (!overlays?.length) {
      return;
    }

    // Fix the x, y positions
    overlays.forEach(overlay => {
      overlay.x ||= 0;
      overlay.y ||= 0;
    });

    // Will clear cached stat data when the overlay data changes
    ImageOverlayViewerTool.addOverlayPlaneModule(imageId, overlayMetadata);

    this._getCachedStat(imageId, overlayMetadata, this.configuration.fillColor).then(cachedStat => {
      cachedStat.overlays.forEach(overlay => {
        this._renderOverlay(enabledElement, svgDrawingHelper, overlay);
      });
    });

    return true;
  };

  /**
   * Render to DOM
   *
   * @param enabledElement
   * @param svgDrawingHelper
   * @param overlayData
   * @returns
   */
  private _renderOverlay(enabledElement, svgDrawingHelper, overlayData) {
    const { viewport } = enabledElement;
    const imageId = this.getReferencedImageId(viewport);
    if (!imageId) {
      return;
    }

    // Decide the rendering position of the overlay image on the current canvas
    const { _id, columns: width, rows: height, x, y } = overlayData;
    const overlayTopLeftWorldPos = utilities.imageToWorldCoords(imageId, [
      x - 1, // Remind that top-left corner's (x, y) is be (1, 1)
      y - 1,
    ]);
    const overlayTopLeftOnCanvas = viewport.worldToCanvas(overlayTopLeftWorldPos);
    const overlayBottomRightWorldPos = utilities.imageToWorldCoords(imageId, [width, height]);
    const overlayBottomRightOnCanvas = viewport.worldToCanvas(overlayBottomRightWorldPos);

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
      console.warn('Invalid rendering attribute for image overlay', attributes['data-id']);
      return false;
    }

    if (existingImageElement) {
      drawing.setAttributesIfNecessary(attributes, existingImageElement);
      svgDrawingHelper.setNodeTouched(svgNodeHash);
    } else {
      const newImageElement = document.createElementNS(svgns, 'image');
      drawing.setNewAttributesIfValid(attributes, newImageElement);
      svgDrawingHelper.appendNode(newImageElement, svgNodeHash);
    }
    return true;
  }

  private async _getCachedStat(
    imageId: string,
    overlayMetadata,
    color: number[]
  ): Promise<CachedStat> {
    const missingOverlay = overlayMetadata.overlays.filter(
      overlay => overlay.pixelData && !overlay.dataUrl
    );
    if (missingOverlay.length === 0) {
      return overlayMetadata;
    }

    const overlays = await Promise.all(
      overlayMetadata.overlays
        .filter(overlay => overlay.pixelData)
        .map(async (overlay, idx) => {
          let pixelData = null;
          if (overlay.pixelData.Value) {
            pixelData = overlay.pixelData.Value;
          } else if (overlay.pixelData instanceof Array) {
            pixelData = overlay.pixelData[0];
          } else if (overlay.pixelData.retrieveBulkData) {
            pixelData = await overlay.pixelData.retrieveBulkData();
          } else if (overlay.pixelData.InlineBinary) {
            const blob = b64toBlob(overlay.pixelData.InlineBinary);
            const arrayBuffer = await blob.arrayBuffer();
            pixelData = arrayBuffer;
          }

          if (!pixelData) {
            return;
          }

          const dataUrl = this._renderOverlayToDataUrl(
            { width: overlay.columns, height: overlay.rows },
            overlay.color || color,
            pixelData
          );

          return {
            ...overlay,
            _id: guid(),
            dataUrl, // this will be a data url expression of the rendered image
            color,
          };
        })
    );
    overlayMetadata.overlays = overlays;

    return overlayMetadata;
  }

  /**
   * compare two RGBA expression of colors.
   *
   * @param color1
   * @param color2
   * @returns
   */
  private _isSameColor(color1: number[], color2: number[]) {
    return (
      color1 &&
      color2 &&
      color1[0] === color2[0] &&
      color1[1] === color2[1] &&
      color1[2] === color2[2] &&
      color1[3] === color2[3]
    );
  }

  /**
   * pixelData of overlayPlane module is an array of bits corresponding
   * to each of the underlying pixels of the image.
   * Let's create pixel data from bit array of overlay data
   *
   * @param pixelDataRaw
   * @param color
   * @returns
   */
  private _renderOverlayToDataUrl({ width, height }, color, pixelDataRaw) {
    const pixelDataView = new DataView(pixelDataRaw);
    const totalBits = width * height;

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

    return canvas.toDataURL();
  }
}

export default ImageOverlayViewerTool;
