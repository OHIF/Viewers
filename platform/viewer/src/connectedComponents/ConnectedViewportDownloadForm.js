import { connect } from 'react-redux';
import { ViewportDownloadForm } from '@ohif/ui';
import { utils } from '@ohif/core';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

const MINIMUM_SIZE = 100;
const DEFAULT_SIZE = 512;
const MAX_TEXTURE_SIZE = 10000;

const mapStateToProps = (state, ownProps) => {
  const { viewportSpecificData, activeViewportIndex } = state.viewports;
  const { dom: activeEnabledElement } =
    viewportSpecificData[activeViewportIndex] || {};

  return {
    onClose: ownProps.hide,
    minimumSize: MINIMUM_SIZE,
    maximumSize: MAX_TEXTURE_SIZE,
    defaultSize: DEFAULT_SIZE,
    canvasClass: 'cornerstone-canvas',
    activeViewport: activeEnabledElement,
    enableViewport: viewportElement => {
      if (viewportElement) {
        cornerstone.enable(viewportElement);
      }
    },
    disableViewport: viewportElement => {
      if (viewportElement) {
        cornerstone.disable(viewportElement);
      }
    },
    updateViewportPreview: (viewportElement, downloadCanvas, fileType) =>
      new Promise(resolve => {
        cornerstone.fitToWindow(viewportElement);

        viewportElement.addEventListener(
          'cornerstoneimagerendered',
          function updateViewport(event) {
            const enabledElement = cornerstone.getEnabledElement(event.target)
              .element;
            const type = 'image/' + fileType;
            const dataUrl = downloadCanvas.toDataURL(type, 1);

            let newWidth = enabledElement.offsetHeight;
            let newHeight = enabledElement.offsetWidth;

            if (newWidth > DEFAULT_SIZE || newHeight > DEFAULT_SIZE) {
              const multiplier = DEFAULT_SIZE / Math.max(newWidth, newHeight);
              newHeight *= multiplier;
              newWidth *= multiplier;
            }

            resolve({ dataUrl, width: newWidth, height: newHeight });

            viewportElement.removeEventListener(
              'cornerstoneimagerendered',
              updateViewport
            );
          }
        );
      }),
    loadImage: (activeViewport, viewportElement, width, height) =>
      new Promise(resolve => {
        if (activeViewport && viewportElement) {
          const enabledElement = cornerstone.getEnabledElement(activeViewport);
          const viewport = Object.assign({}, enabledElement.viewport);
          delete viewport.scale;
          viewport.translation = {
            x: 0,
            y: 0,
          };

          cornerstone.loadImage(enabledElement.image.imageId).then(image => {
            cornerstone.displayImage(viewportElement, image);
            cornerstone.setViewport(viewportElement, viewport);
            cornerstone.resize(viewportElement, true);

            const newWidth = Math.min(width || image.width, MAX_TEXTURE_SIZE);
            const newHeight = Math.min(
              height || image.height,
              MAX_TEXTURE_SIZE
            );

            resolve({ image, width: newWidth, height: newHeight });
          });
        }
      }),
    toggleAnnotations: (toggle, viewportElement) => {
      cornerstoneTools.store.state.tools.forEach(({ name }) => {
        if (toggle) {
          cornerstoneTools.setToolEnabledForElement(viewportElement, name);
        } else {
          cornerstoneTools.setToolDisabledForElement(viewportElement, name);
        }
      });
    },
    downloadBlob: (filename, fileType, viewportElement, downloadCanvas) => {
      const file = `${filename}.${fileType}`;
      const mimetype = `image/${fileType}`;

      /* Handles JPEG images for IE11 */
      if (downloadCanvas.msToBlob && fileType === 'jpeg') {
        const image = downloadCanvas.toDataURL(mimetype, 1);
        const blob = utils.b64toBlob(
          image.replace('data:image/jpeg;base64,', ''),
          mimetype
        );
        return window.navigator.msSaveBlob(blob, file);
      }

      viewportElement.querySelector('canvas').toBlob(blob => {
        const URLObj = window.URL || window.webkitURL;
        const a = document.createElement('a');
        a.href = URLObj.createObjectURL(blob);
        a.download = file;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    },
  };
};

const ConnectedViewportDownloadForm = connect(
  mapStateToProps,
  null
)(ViewportDownloadForm);

export default ConnectedViewportDownloadForm;
