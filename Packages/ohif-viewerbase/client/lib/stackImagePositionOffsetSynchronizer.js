import { OHIF } from 'meteor/ohif:core';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

class StackImagePositionOffsetSynchronizer {
  constructor() {
    this.active = false;
    this.syncedViewportElements = [];
    this.synchronizer = new cornerstoneTools.Synchronizer("CornerstoneNewImage", cornerstoneTools.stackImagePositionOffsetSynchronizer)
  }

  static get ELEMENT_DISABLED_EVENT() {
    return 'CornerstoneElementDisabled.StackImagePositionOffsetSynchronizer';
  }

  isActive() {
    return this.active;
  }

  activate() {
    if(this.isActive()) {
      return;
    }

    const viewportElements = this.getLinkableViewports();

    viewportElements.forEach((viewportElement, index) => {
      this.synchronizer.add(viewportElement);
      this.syncedViewportElements.push(viewportElement);
      
      $(viewportElement).on(StackImagePositionOffsetSynchronizer.ELEMENT_DISABLED_EVENT, this.elementDisabledHandler(this));
    });

    this.active = true;
  }

  deactivate() {
    if(!this.isActive()) {
      return;
    }

    while(this.syncedViewportElements.length) {
      const viewportElement = this.syncedViewportElements[0];
      this.removeViewportElement(viewportElement);
    }

    this.active = false;
  }

  update() {
    if(!this.isActive()) {
      return;
    }

    const activeViewportElement = this.getActiveViewportElement();

    if(this.isViewportSynced(activeViewportElement)) {
      return;
    }

    this.deactivate();
    this.activate();
  }

  getActiveViewportElement() {
    const viewportIndex = Session.get('activeViewport') || 0;
    return $('.imageViewerViewport').get(viewportIndex);
  }

  isViewportSynced(viewportElement) {
    let isSynced = false;

    this.syncedViewportElements.forEach(syncedViewportElement => {
      isSynced = isSynced || (syncedViewportElement === viewportElement);
    });

    return isSynced;
  }

  removeViewportElement(viewportElement) {
    const index = this.syncedViewportElements.indexOf(viewportElement);

    if(index === -1) {
      return;
    }

    this.syncedViewportElements.splice(index, 1);
    this.synchronizer.remove(viewportElement);
    $(viewportElement).off(StackImagePositionOffsetSynchronizer.ELEMENT_DISABLED_EVENT);
  }

  elementDisabledHandler(context) {
    return (e, eventData) => {
      context.removeViewportElement(eventData.element);
    }
  }

  getLinkableViewports() {
    const activeViewportElement = this.getActiveViewportElement();
    const activeViewportImageNormal = this.getViewportImageNormal(activeViewportElement);
    const viewportElements = [];

    $('.imageViewerViewport').each((index, viewportElement) => {
      const viewportImageNormal = this.getViewportImageNormal(viewportElement);

      if(activeViewportImageNormal && viewportImageNormal) {
        const angleInRadians = viewportImageNormal.angleTo(activeViewportImageNormal);

        // Pi / 12 radians = 15 degrees
        // If the angle between two vectors is Pi, it means they are just inverted
        if (angleInRadians < Math.PI / 12 || angleInRadians === Math.PI) {
          viewportElements.push(viewportElement)
        }
      }
    });

    return viewportElements;
  }

  getViewportImageNormal(element) {
      element = $(element).get(0);

      try {
        const enabledElement = cornerstone.getEnabledElement(element);
        const imageId = enabledElement.image.imageId;
        const imagePlane = cornerstoneTools.metaData.get('imagePlane', imageId);

        return imagePlane.rowCosines.clone().cross(imagePlane.columnCosines);;
      } catch(error) {
        console.log(error.message);
      }
  }
}

OHIF.viewer.stackImagePositionOffsetSynchronizer = new StackImagePositionOffsetSynchronizer();