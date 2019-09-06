import createImageFromEnabledElementAsync from './createImageFromEnabledElementAsync';

class DownloadViewportEngine {
  constructor() {
    this.$previewElement = null;
    this.$activeViewport = null;
    this.size = null;

    this.mountPreview = this.mountPreview.bind(this);
    this.save = this.save.bind(this);
    this.resize = this.resize.bind(this);
    this.resetSize = this.resetSize.bind(this);
    this.toggleAnnotations = this.toggleAnnotations.bind(this);
    this.updateCache = this.updateCache.bind(this);
    this.showBlobImage = this.showBlobImage.bind(this);
    this.getInfo = this.getInfo.bind(this);
  }

  resize(prop, value) {
    const resizingElement = cornerstone.getEnabledElement(this.$activeViewport).element;
    const resizingCanvas = resizingElement.querySelector('canvas');

    resizingElement.style[prop] = `${value}px`;
    resizingCanvas.style[prop]  = `${value}px`;
    cornerstone.fitToWindow(this.$activeViewport);
  }

  resetSize() {
    const resizingElement = cornerstone.getEnabledElement(this.$activeViewport).element;
    const resizingCanvas = resizingElement.querySelector('canvas');

    resizingElement.style.width = this.originalElementWidth;
    resizingElement.style.height = this.originalElementHeigth;

    resizingCanvas.style.width  = this.originalCanvasWidth;
    resizingCanvas.style.height  = this.originalCanvasHeigth;
    cornerstone.fitToWindow(this.$activeViewport);
  }

  toggleAnnotations(toggle, reMountPreview = false) {
    const availableTools = cornerstoneTools.store.state.tools.map(tool => tool.name);
    const enabledElement = cornerstone.getEnabledElement(this.$activeViewport);
    const { element } = enabledElement;

    availableTools.forEach(tool => {
      if (toggle) {
        cornerstoneTools.setToolEnabledForElement(element, tool);
      } else {
        cornerstoneTools.setToolDisabledForElement(element, tool);
      }
    });

    cornerstone.updateImage(this.$activeViewport, true);

    if (reMountPreview) {
      this.mountPreview();
    }
  }

  getInfo() {
    const element = cornerstone.getEnabledElement(this.$activeViewport);
    return {
      fileName: 'Image',
      width: element.image.width || 0,
      height: element.image.height || 0,
    };
  }

  async updateCache(
    previewElemReference = this.$previewElement,
    activeViewport =  this.$activeViewport
  ){
    this.$previewElement = previewElemReference;
    this.$activeViewport = activeViewport;

    const originalElement = cornerstone.getEnabledElement(this.$activeViewport).element;
    const originalCanvas = originalElement.querySelector('canvas');

    this.originalElementWidth = originalElement.style.width;
    this.originalElementHeigth = originalElement.style.height;
    this.originalCanvasWidth = originalCanvas.style.width;
    this.originalCanvasHeigth = originalCanvas.style.height;
  }

  showBlobImage(blob) {
    const urlCreator = window.URL || window.webkitURL;
    this.$previewElement.src = urlCreator.createObjectURL(blob);
  }

  mountPreview() {
    createImageFromEnabledElementAsync(this.$activeViewport, this.showBlobImage);
  }

  save(formData) {
    cornerstoneTools.SaveAs(
      this.$activeViewport,
      `${formData.fileName}.${formData.fileType}`,
      `image/${formData.fileType}`
    );
  }
}

export default DownloadViewportEngine;