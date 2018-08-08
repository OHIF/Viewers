import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { setActiveViewport } from './setActiveViewport';

const loadPreviousActivePanel = () => {
    OHIF.log.info('nextActivePanel');
    let currentIndex = Session.get('activeViewport');
    currentIndex--;

    const $viewports = $('.viewportContainer');
    const numViewports = $viewports.length;
    if (currentIndex < 0) {
        currentIndex = numViewports - 1;
    }

    const viewportContainer = $viewports.get(currentIndex);
    if (!viewportContainer) {
        return;
    }

    setActiveViewport(viewportContainer);
};

const loadNextActivePanel = () => {
    OHIF.log.info('nextActivePanel');
    let currentIndex = Session.get('activeViewport');
    currentIndex++;

    const $viewports = $('.viewportContainer');
    const numViewports = $viewports.length;
    if (currentIndex >= numViewports) {
        currentIndex = 0;
    }

    const viewportContainer = $viewports.get(currentIndex);
    if (!viewportContainer) {
        return;
    }

    setActiveViewport(viewportContainer);
};

/**
 * Export functions inside panelNavigation namespace.
 */

const panelNavigation = {
    loadPreviousActivePanel,
    loadNextActivePanel
};

export { panelNavigation };
