import createImageFromEnabledElementAsync from './createImageFromEnabledElementAsync';

/**
 * @exports @public @class
 */
class DownloadViewportEngine {
  constructor() {
    this.$previewElement = null;
    this.$activeViewport = null;
    this.$activeElement = null;
    this.$activeCanvas = null;
    this.originalElementWidth = null;
    this.originalElementHeigth = null;
    this.originalCanvasWidth = null;
    this.originalCanvasHeigth = null;

    this.mountPreview = this.mountPreview.bind(this);
    this.save = this.save.bind(this);
    this.resize = this.resize.bind(this);
    this.resetSize = this.resetSize.bind(this);
    this.toggleAnnotations = this.toggleAnnotations.bind(this);
    this.updateCache = this.updateCache.bind(this);
    this.showBlobImage = this.showBlobImage.bind(this);
    this.getInfo = this.getInfo.bind(this);
  }

  /**
   * resize the original viewport before saving, according to user's preferences
   * @param {string} prop the css style prop about to be changed
   * @param {number} value the value to be applied on the css prop
   */
  resize(prop, value = 0) {
    this.$activeElement.style[prop] = `${value}px`;
    this.$activeCanvas.style[prop]  = `${value}px`;

    cornerstone.resize(this.$activeViewport, true);
    cornerstone.fitToWindow(this.$activeViewport);
    cornerstone.updateImage(this.$activeViewport, true);
    this.mountPreview();
  }

  /**
   * resetSize - Reset the active view port to it's initial state, when download modal is closed
   * @returns void
   */
  resetSize() {
    this.$activeElement.style.width = this.originalElementWidth;
    this.$activeElement.style.height = this.originalElementHeigth;
    this.$activeCanvas.style.width  = this.originalCanvasWidth;
    this.$activeCanvas.style.height  = this.originalCanvasHeigth;
    cornerstone.fitToWindow(this.$activeViewport);
    cornerstone.updateImage(this.$activeViewport, true);
    cornerstone.resize(this.$activeViewport, true);
    cornerstone.fitToWindow(this.$activeViewport);
  }

  /**
   * toggleAnnotations - controls annotations visibility
   * @param {boolean} toggle boolean to control if the annotations are shown
   * @param {boolean} [reMountPreview=false] flag to control if the blob should
   * be remounted or not, useful on events like closeModal, saved etc.
   */
  toggleAnnotations(toggle, reMountPreview = false) {
    const availableTools = cornerstoneTools.store.state.tools.map(tool => tool.name);
    const element = this.$activeElement;

    availableTools.forEach(tool => {
      if (toggle) {
        cornerstoneTools.setToolEnabledForElement(element, tool);
        cornerstone.enable(this.$activeElement);
      } else {
        cornerstoneTools.setToolDisabledForElement(element, tool);
      }
    });

    cornerstone.updateImage(this.$activeViewport, true);

    if (reMountPreview) {
      this.mountPreview();
    }
  }

  /**
   * getInfo - get All information related to the image used on the modal state
   * @returns {{width: (*|number), height: (*|number)}}
   */
  getInfo() {
    const element = cornerstone.getEnabledElement(this.$activeViewport);
    let aspectRatio = 0;

    try {
      aspectRatio = element.image.width / element.image.height;
    } catch (e) {
      console.log(e);
    }

    return {
      width: element.image.width || 0,
      height: element.image.height || 0,
      aspectRatio,
    };
  }

  /**
   * updateCache - caches elements, canvas and viewports to improve performance avoiding getting them all the times from cornerstone
   * @param {HTMLElement} [previewElemReference=this.$previewElement] the HTML img element selector designated to the preview
   * @param {HTMLElement} activeViewport The target enabledElement to use when generating an image
   * @returns {Promise<void>}
   */
  async updateCache(
    previewElemReference = this.$previewElement,
    activeViewport =  this.$activeViewport
  ){
    this.$previewElement = previewElemReference;
    this.$activeViewport = activeViewport;
    this.$activeElement = cornerstone.getEnabledElement(this.$activeViewport).element;
    this.$activeCanvas = this.$activeElement.querySelector('canvas');

    this.originalElementWidth = this.$activeElement.style.width;
    this.originalElementHeigth = this.$activeElement.style.height;
    this.originalCanvasWidth = this.$activeCanvas.style.width;
    this.originalCanvasHeigth = this.$activeCanvas.style.height;
  }

  /**
   * Generates the new blob to feed the previewer image
   * @param {blob} blob
   */
  showBlobImage(blob) {
    const urlCreator = window.URL || window.webkitURL;
    this.$previewElement.src = urlCreator.createObjectURL(blob);
  }

  /**
   * mountPreview - The initial method that generates blob and prints the preview inside previewer image
   */
  mountPreview() {
    createImageFromEnabledElementAsync(this.$activeViewport, this.showBlobImage);
  }

  /**
   * save - downloads the generated image to client's Hard Drive
   * @param {Object} formData all data collected to customize the download
   * @param {string} formData.fileName the name to be used on save
   * @param {string} formData.fileType the file extension ex. .jpg, .png
   */
  save(formData) {
    cornerstoneTools.SaveAs(
      this.$activeViewport,
      `${formData.fileName}.${formData.fileType}`,
      `image/${formData.fileType}`
    );
  }
}

export default DownloadViewportEngine;