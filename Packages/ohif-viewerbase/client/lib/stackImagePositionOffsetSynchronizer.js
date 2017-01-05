import { OHIF } from 'meteor/ohif:core';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

class StackImagePositionOffsetSynchronizer {
  constructor() {
    this.active = false;
    this.syncedViewports = [];
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

    const viewports = this.getLinkableViewports();
    const viewportIndexes = [];

    if(viewports.length <= 1) {
      return;
    }

    viewports.forEach((viewport, index) => {
      this.synchronizer.add(viewport.element);
      this.syncedViewports.push(viewport);
      viewportIndexes.push(viewport.index)
      
      $(viewport.element).on(StackImagePositionOffsetSynchronizer.ELEMENT_DISABLED_EVENT, this.elementDisabledHandler(this));
    });

    this.active = true;
    toolManager.activateCommandButton('link');
    Session.set('StackImagePositionOffsetSynchronizerLinkedViewports', viewportIndexes);
  }

  deactivate() {
    if(!this.isActive()) {
      return;
    }

    while(this.syncedViewports.length) {
      const viewport = this.syncedViewports[0];
      this.removeViewport(viewport);
    }

    this.active = false;
    toolManager.deactivateCommandButton('link');
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

  isViewportSynced(viewportElement) {
    return !!this.getViewportByElement(viewportElement);
  }

  getActiveViewportElement() {
    const viewportIndex = Session.get('activeViewport') || 0;
    return $('.imageViewerViewport').get(viewportIndex);
  }

  removeViewport(viewport) {
    const index = this.syncedViewports.indexOf(viewport);

    if(index === -1) {
      return;
    }

    this.syncedViewports.splice(index, 1);
    this.synchronizer.remove(viewport.element);
    this.removeLinkedViewportFromSession(viewport);
    $(viewport.element).off(StackImagePositionOffsetSynchronizer.ELEMENT_DISABLED_EVENT);
  }

  getViewportByElement(viewportElement) {
    const length = this.syncedViewports.length;

    for(let i = 0; i < length; i++) {
      const viewport = this.syncedViewports[i];
      
      if(viewport.element === viewportElement) {
        return viewport;
      }
    }
  }

  removeViewportByElement(viewportElement) {
    let viewport = this.getViewportByElement(viewportElement);

    if(viewport) {
      this.removeViewport(viewport);
    }
  }

  removeLinkedViewportFromSession(viewport) {
    const linkedViewports = Session.get('StackImagePositionOffsetSynchronizerLinkedViewports');
    const index = linkedViewports.indexOf(viewport.index);

    if(index !== -1) {
      linkedViewports.splice(index, 1);
      Session.set('StackImagePositionOffsetSynchronizerLinkedViewports', linkedViewports);
    }
  }

  elementDisabledHandler(context) {
    return (e, eventData) => {
      context.removeViewportByElement(eventData.element);
    }
  }

  getLinkableViewports() {
    const activeViewportElement = this.getActiveViewportElement();
    const activeViewportImageNormal = this.getViewportImageNormal(activeViewportElement);
    const viewports = [];

    $('.imageViewerViewport').each((index, viewportElement) => {
      const viewportImageNormal = this.getViewportImageNormal(viewportElement);

      if(activeViewportImageNormal && viewportImageNormal) {
        const angleInRadians = viewportImageNormal.angleTo(activeViewportImageNormal);

        // Pi / 12 radians = 15 degrees
        // If the angle between two vectors is Pi, it means they are just inverted
        if (angleInRadians < Math.PI / 12 || angleInRadians === Math.PI) {
          viewports.push({
            index: index,
            element: viewportElement
          });
        }
      }
    });

    return viewports;
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