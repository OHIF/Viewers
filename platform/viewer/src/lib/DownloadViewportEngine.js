import createImageFromEnabledElementAsync from './createImageFromEnabledElementAsync';

class DownloadViewportEngine {
  constructor() {
    this.$previewElement = null;
    this.$activeViewport = null;
    this.size = null;

    this.mountPreview = this.mountPreview.bind(this);
    this.save = this.save.bind(this);
    this.resize = this.resize.bind(this);
    this.toggleAnnotations = this.toggleAnnotations.bind(this);
    this.updateCache = this.updateCache.bind(this);
    this.showBlobImage = this.showBlobImage.bind(this);
    this.getInfo = this.getInfo.bind(this);
  }

  resize(prop, value) {
    const resizingElement = this.$activeViewport;
    const resizingCanvas = resizingElement.querySelector('canvas');

    resizingElement.style[prop] = `${value}px`;
    resizingCanvas.style[prop]  = `${value}px`;
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