class DownloadViewportEngine {
  constructor() {
    this.$previewElement = null;
    this.$downloadElement = null;
    this.$activeViewport = null;
    this.clone = this.clone.bind(this);
    this.save = this.save.bind(this);
    this.setElementSize = this.setElementSize.bind(this);
    this.toggleAnnotations = this.toggleAnnotations.bind(this);
    this.availableTools = ['length', 'Probe', 'SimpleAngle', 'ArrowAnnotate', 'EllipticalRoi', 'rectangleRoi'];
  }

  setElementSize(element, prop, value) {
    const resizingElement = element ? element : this.$downloadElement;

    resizingElement.style[prop] = `${value}px`;
    const canvas = resizingElement.querySelector('canvas');
    canvas.style[prop] = `${value}px`;
  }

  toggleAnnotations(showAnnotations) {
    const action = (showAnnotations) ? 'Enabled' : 'Disabled';

    /// const availableTools = cornerstoneTools.getActiveToolsForElement(this.$activeViewport);

    this.availableTools.forEach(tool => {
      console.log(tool);
      cornerstoneTools[`setTool${action}ForElement`](this.$previewElement, tool);
      cornerstoneTools[`setTool${action}ForElement`](this.$downloadElement, tool);
      /*cornerstoneTools[tool][action](this.$previewElement);
      cornerstoneTools[tool][action](this.$downloadElement);*/
    });
  }

  clone(previewElemReference, activeViewport) {



    // Timeout and if to protect from React updates while element is still null
    setTimeout(() => {
      if (previewElemReference && previewElemReference.current) {

        console.log('cloning', activeViewport );

        const enabledElement = cornerstone.getEnabledElement(activeViewport);
        console.log(enabledElement);

        // Caches the DOM elements
        this.$previewElement = previewElemReference.current;
        this.$downloadElement = document.createElement('div');
        this.$activeViewport = activeViewport;

        // Clones the real viewport, so changing width and height will not affect the original one
        const clonedViewportForPreview = enabledElement.element.cloneNode(true);

        console.log(enabledElement);
        this.$previewElement.appendChild(clonedViewportForPreview);

        // Builds up a spare viewport, so the true resized image will be the canvas model for downloading
        const clonedViewportForDownload = activeViewport.cloneNode(true);
        this.$downloadElement.appendChild(clonedViewportForDownload);
        this.$downloadElement.setAttribute('id', "download-element");

        // Adds the hidden spare viewer, right before the true previewer
        const parentNode = document.querySelector('.DownloadDialog .preview .col');
        parentNode.appendChild(this.$downloadElement);

        // Enabling copies
        cornerstone.enable(this.$previewElement);
        cornerstone.enable(this.$downloadElement);

        cornerstone.resize(this.$previewElement, true);
        cornerstone.resize(this.$downloadElement, true);

        cornerstone.loadImage(enabledElement.image.imageId)
          .then( image =>  {
            cornerstone.displayImage(this.$previewElement, image);
            cornerstone.displayImage(this.$downloadElement, image);

            cornerstone.resize(this.$previewElement, true);
            cornerstone.resize(this.$previewElement, true);

            this.setElementSize(this.$previewElement, 'width', 300);
            this.setElementSize(this.$previewElement, 'height', 200);

            this.setElementSize(this.$downloadElement, 'width', 3000);
            this.setElementSize(this.$downloadElement, 'height', 2000);

            cornerstone.fitToWindow(this.$downloadElement);
            cornerstone.fitToWindow(this.$previewElement);

            this.toggleAnnotations(true);
          });
      }
    }, 50);
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