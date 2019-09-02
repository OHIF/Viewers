const DOWNLOAD_ELEMENT_ID = 'download-element';
const PREVIEW_ELEMENT_ID = 'preview-element';

class DownloadViewportEngine {
  constructor() {
    this.$previewElement = null;
    this.$downloadElement = document.createElement('div');
    this.$activeViewport = null;
    this.reRenderActionCache = null;
    this.showAnnotations = false;

    // TODO - Maybe there is a way to get all these tools dynamically?
    this.availableTools = [
      'LengthTool',
      'WwwcTool',
      'BidirectionalTool',
      'AngleTool',
      'StackScrollTool',
      'BrushTool',
      'FreehandMouseTool',
      'EllipticalRoiTool',
      'CircleRoiTool',
      'RectangleRoiTool'
    ];

    this.updateHash = null;

    this.mountPreview = this.mountPreview.bind(this);
    this.save = this.save.bind(this);
    this.setElementSize = this.setElementSize.bind(this);
    this.toggleAnnotations = this.toggleAnnotations.bind(this);
    this.updateCache = this.updateCache.bind(this);
    this.enableCornerstoneTools = this.enableCornerstoneTools.bind(this);
    this.showPreview = this.showPreview.bind(this);
  }

  setElementSize(element, prop, value) {
    const resizingElement = element ? element : this.$downloadElement;
    resizingElement.style[prop] = `${value}px`;
    const canvas = resizingElement.querySelector('canvas');
    canvas.style[prop] = `${value}px`;
  }

  toggleAnnotations() {
    const element = this.$downloadElement;
    this.availableTools.forEach(tool => {
      if (this.showAnnotations) {
        cornerstoneTools.setToolEnabledForElement(element, tool.replace('Tool', ''));
      } else {
        cornerstoneTools.setToolDisabledForElement(element, tool.replace('Tool', ''));
      }
    });
  }

  updateCache(
    previewElemReference = this.$previewElement,
    activeViewport =  this.$activeViewport,
    reRenderAction = this.reRenderActionCache,
    showAnnotations = this.showAnnotations,
  ){
    this.$previewElement = previewElemReference;
    this.$activeViewport = activeViewport;
    this.reRenderActionCache = reRenderAction;
    this.showAnnotations = showAnnotations;
  }

  enableCornerstoneTools(element = this.$downloadElement) {
    const enabledElement = cornerstone.getEnabledElement(this.$activeViewport);
    const isAlreadyEnabled = cornerstone.getEnabledElements().some(element => (element.element.id === 'preview-element'));

    if (!isAlreadyEnabled) {
      cornerstone.enable(element);
    }

    cornerstone.loadImage(enabledElement.image.imageId)
      .then( image =>  {
        cornerstone.displayImage(element, image);
        cornerstone.resize(element, true);

        this.setElementSize(element, 'width', 300);
        this.setElementSize(element, 'height', 200);
        cornerstone.fitToWindow(element);

        this.availableTools.forEach(tool => {
          cornerstoneTools.addToolForElement(element, cornerstoneTools[tool], {});
          cornerstoneTools.setToolEnabledForElement(element, tool.replace('Tool', ''));
        });
      });
  }

  showPreview() {
    this.$downloadElement.setAttribute('id', PREVIEW_ELEMENT_ID);
    this.$previewElement.appendChild(this.$downloadElement);
  }

  clean() {
    const elementToClean = document.getElementById(DOWNLOAD_ELEMENT_ID);

    if (elementToClean) {
      elementToClean.remove();
    }
  }

  cloneDomElement() {

    const thereIsADownloadElement = document.getElementById(DOWNLOAD_ELEMENT_ID);

    if (thereIsADownloadElement) {
      return null;
    }

    // Builds up a spare viewport, so the true resized image will be the canvas model for downloading
    const clonedViewportForDownload = this.$activeViewport.cloneNode(true);
    this.$downloadElement.appendChild(clonedViewportForDownload);
    this.$downloadElement.setAttribute('id', DOWNLOAD_ELEMENT_ID);

    // Adds the hidden spare viewer on body, away from React Updates
    const parentNode = document.querySelector('body');
    parentNode.appendChild(this.$downloadElement);
  }

  mountPreview() {
    this.cloneDomElement();
    this.enableCornerstoneTools();
    this.showPreview();
  }

  save(formData) {
    cornerstoneTools.SaveAs(
      this.$downloadElement,
      `${formData.fileName}.${formData.fileType}`,
      `image/${formData.fileType}`
    );
  }
}

export default DownloadViewportEngine;