import createImageFromEnabledElementAsync from './createImageFromEnabledElementAsync';

class DownloadViewportEngine {
  constructor() {
    this.$previewElement = null;
    this.$activeViewport = null;

    this.mountPreview = this.mountPreview.bind(this);
    this.save = this.save.bind(this);
    this.resize = this.resize.bind(this);
    this.toggleAnnotations = this.toggleAnnotations.bind(this);
    this.updateCache = this.updateCache.bind(this);
    this.showBlobImage = this.showBlobImage.bind(this);
  }

  resize(element, prop, value) {
    const resizingElement = element ? element : this.$downloadElement;
    resizingElement.style[prop] = `${value}px`;
    const canvas = resizingElement.querySelector('canvas');
    canvas.style[prop] = `${value}px`;
  }

  toggleAnnotations() {
    // TODO - How to deal with annotations with new method?
  }

  updateCache(
    previewElemReference = this.$previewElement,
    activeViewport =  this.$activeViewport,
    showAnnotations = this.showAnnotations,
  ){
    this.$previewElement = previewElemReference;
    this.$activeViewport = activeViewport;
    this.showAnnotations = showAnnotations;
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