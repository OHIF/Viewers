import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { setActiveViewport } from './setActiveViewport';

const loadPreviousActivePanel = () => {
    OHIF.log.info('nextActivePanel');
    let currentIndex = Session.get('activeViewport');
    currentIndex--;

    const $viewports = $('.imageViewerViewport');
    const numViewports = $viewports.length;
    if (currentIndex < 0) {
        currentIndex = numViewports - 1;
    }

    const element = $viewports.get(currentIndex);
    if (!element) {
        return;
    }

    setActiveViewport(element);
};

const loadNextActivePanel = () => {
    OHIF.log.info('nextActivePanel');
    let currentIndex = Session.get('activeViewport');
    currentIndex++;

    const $viewports = $('.imageViewerViewport');
    const numViewports = $viewports.length;
    if (currentIndex >= numViewports) {
        currentIndex = 0;
    }

    const element = $viewports.get(currentIndex);
    if (!element) {
        return;
    }

    setActiveViewport(element);
};

/**
 * Export functions inside panelNavigation namespace.
 */

const panelNavigation = {
    loadPreviousActivePanel,
    loadNextActivePanel
};

export { panelNavigation };
