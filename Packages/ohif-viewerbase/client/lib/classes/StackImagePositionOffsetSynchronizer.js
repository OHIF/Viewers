import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
import { toolManager } from '../toolManager';

export class StackImagePositionOffsetSynchronizer {
    constructor() {
        this.active = false;
        this.syncedViewports = [];
        this.synchronizer = new cornerstoneTools.Synchronizer('cornerstonenewimage', cornerstoneTools.stackImagePositionOffsetSynchronizer);
    }

    static get ELEMENT_DISABLED_EVENT() {
        return 'cornerstoneelementdisabled.StackImagePositionOffsetSynchronizer';
    }

    isActive() {
        return this.active;
    }

    activate() {
        const viewports = this.getLinkableViewports();
        this.syncViewports(viewports);
    }

    activateByViewportIndexes(viewportIndexes) {
        const viewports = this.getViewportByIndexes(viewportIndexes);
        this.syncViewports(viewports);
    }

    deactivate() {
        if (!this.isActive()) {
            return;
        }

        while (this.syncedViewports.length) {
            const viewport = this.syncedViewports[0];
            this.removeViewport(viewport);
        }

        this.active = false;
        toolManager.deactivateCommandButton('linkStackScroll');
    }

    update() {
        if (!this.isActive()) {
            return;
        }

        const activeViewportElement = this.getActiveViewportElement();

        if (this.isViewportSynced(activeViewportElement)) {
            return;
        }

        this.deactivate();
        this.activate();
    }

    syncViewports(viewports) {
        const viewportIndexes = [];

        if (this.isActive() || (viewports.length <= 1)) {
            return;
        }

        viewports.forEach((viewport, index) => {
            this.synchronizer.add(viewport.element);
            this.syncedViewports.push(viewport);
            viewportIndexes.push(viewport.index);
            if (!this.disabledListener) {
                this.disabledListener = this.elementDisabledHandler(this);
            }

            viewport.element.addEventListener(StackImagePositionOffsetSynchronizer.ELEMENT_DISABLED_EVENT, this.disabledListener);
        });

        this.active = true;
        toolManager.activateCommandButton('linkStackScroll');
        Session.set('StackImagePositionOffsetSynchronizerLinkedViewports', viewportIndexes);
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

        if (index === -1) {
            return;
        }

        this.syncedViewports.splice(index, 1);
        this.synchronizer.remove(viewport.element);
        this.removeLinkedViewportFromSession(viewport);
        viewport.element.removeEventListener(StackImagePositionOffsetSynchronizer.ELEMENT_DISABLED_EVENT, this.disabledListener);
    }

    getViewportByElement(viewportElement) {
        const length = this.syncedViewports.length;

        for (let i = 0; i < length; i++) {
            const viewport = this.syncedViewports[i];

            if (viewport.element === viewportElement) {
                return viewport;
            }
        }
    }

    removeViewportByElement(viewportElement) {
        let viewport = this.getViewportByElement(viewportElement);

        if (viewport) {
            this.removeViewport(viewport);
        }
    }

    removeLinkedViewportFromSession(viewport) {
        const linkedViewports = Session.get('StackImagePositionOffsetSynchronizerLinkedViewports');
        const index = linkedViewports.indexOf(viewport.index);

        if (index !== -1) {
            linkedViewports.splice(index, 1);
            Session.set('StackImagePositionOffsetSynchronizerLinkedViewports', linkedViewports);
        }
    }

    elementDisabledHandler(context) {
        return e => context.removeViewportByElement(e.detail.element);
    }

    getViewportByIndexes(viewportIndexes) {
        const viewports = [];
        const $viewportElements = $('.imageViewerViewport');

        viewportIndexes.forEach(index => {
            const element = $viewportElements.get(index);

            if (!element) {
                return;
            }

            viewports.push({
                index,
                element
            });
        });

        return viewports;
    }

    isViewportsLinkable(viewportElementA, viewportElementB) {
        const viewportAImageNormal = this.getViewportImageNormal(viewportElementA);
        const viewportBImageNormal = this.getViewportImageNormal(viewportElementB);

        if (viewportAImageNormal && viewportBImageNormal) {
            const angleInRadians = viewportBImageNormal.angleTo(viewportAImageNormal);

            // Pi / 12 radians = 15 degrees
            // If the angle between two vectors is Pi, it means they are just inverted
            return angleInRadians < Math.PI / 12 || angleInRadians === Math.PI;
        }

        return false;
    }

    getLinkableViewports() {
        const activeViewportElement = this.getActiveViewportElement();
        const viewports = [];

        $('.imageViewerViewport').each((index, viewportElement) => {
            if (this.isViewportsLinkable(activeViewportElement, viewportElement)) {
                viewports.push({
                    index: index,
                    element: viewportElement
                });
            }
        });

        return viewports;
    }

    getViewportImageNormal(element) {
        if (!element) {
            return;
        }

        element = $(element).get(0);

        try {
            const enabledElement = cornerstone.getEnabledElement(element);

            if (!enabledElement.image) {
                return;
            }

            const imageId = enabledElement.image.imageId;
            const imagePlane = cornerstone.metaData.get('imagePlane', imageId);

            if (!imagePlane || !imagePlane.rowCosines || !imagePlane.columnCosines) {
                return;
            }

            return imagePlane.rowCosines.clone().cross(imagePlane.columnCosines);
        } catch(error) {
            const errorMessage = error.message || error;
            OHIF.log.info(`StackImagePositionOffsetSynchronizer getViewportImageNormal: ${errorMessage}`);
        }
    }
}
