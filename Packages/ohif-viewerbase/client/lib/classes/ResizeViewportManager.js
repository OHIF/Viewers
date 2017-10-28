import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';
import { getInstanceClassDefaultViewport } from '../instanceClassSpecificViewport';

// Manage resizing viewports triggered by window resize
export class ResizeViewportManager {
    constructor() {
        this._resizeHandler = null;
    }

    // Reposition Study Series Quick Switch based whether side bars are opened or not
    repositionStudySeriesQuickSwitch() {
        OHIF.log.info('ResizeViewportManager repositionStudySeriesQuickSwitch');

        // Stop here if viewer is not displayed
        const isViewer = Session.get('ViewerOpened');
        if (!isViewer) return;

        // Stop here if there is no one or only one viewport
        const nViewports = OHIF.viewerbase.layoutManager.viewportData.length;
        if (!nViewports || nViewports <= 1) return;

        const $viewer = $('#viewer');
        const leftSidebar = $viewer.find('.sidebar-left.sidebar-open');
        const rightSidebar = $viewer.find('.sidebar-right.sidebar-open');

        const $leftQuickSwitch = $('.quickSwitchWrapper.left');
        const $rightQuickSwitch = $('.quickSwitchWrapper.right');

        const hasLeftSidebar = leftSidebar.length > 0;
        const hasRightSidebar = rightSidebar.length > 0;

        $rightQuickSwitch.removeClass('left-sidebar-only');
        $leftQuickSwitch.removeClass('right-sidebar-only');

        let leftOffset = 0;

        if (hasLeftSidebar) {
            leftOffset = (leftSidebar.width() / $(window).width()) * 100;

            if (!hasRightSidebar) {
                $rightQuickSwitch.addClass('left-sidebar-only');
            }
        }

        if (hasRightSidebar && !hasLeftSidebar) {
            $leftQuickSwitch.addClass('right-sidebar-only');
        }

        const leftPosition = (($('#imageViewerViewports').width() / nViewports) / $(window).width()) * 100 + leftOffset;
        const rightPosition = 100 - leftPosition;

        $leftQuickSwitch.css('right', rightPosition + '%');
        $rightQuickSwitch.css('left', leftPosition + '%');
    }

    // Relocate dialogs positions
    relocateDialogs(){
        OHIF.log.info('ResizeViewportManager relocateDialogs');

        const $bottomRightDialogs = $('#annotationDialog, #textMarkerOptionsDialog');
        $bottomRightDialogs.css({
            top: '', // This removes the CSS property completely
            left: '',
            bottom: 0,
            right: 0
        });

        const centerDialogs = $('.draggableDialog').not($bottomRightDialogs);

        centerDialogs.css({
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        });
    }

    // Resize viewport scrollbars
    resizeScrollbars(element) {
        OHIF.log.info('ResizeViewportManager resizeScrollbars');

        const $currentOverlay = $(element).siblings('.imageViewerViewportOverlay');
        $currentOverlay.find('.scrollbar').trigger('rescale');
    }

    // Resize a single viewport element
    resizeViewportElement(element, fitToWindow = true) {
        let enabledElement;
        try {
            enabledElement = cornerstone.getEnabledElement(element);
        } catch(error) {
            return;
        }

        cornerstone.resize(element, fitToWindow);

        if (enabledElement.fitToWindow === false) {
            const imageId = enabledElement.image.imageId;
            const instance = cornerstone.metaData.get('instance', imageId);
            const instanceClassViewport = getInstanceClassDefaultViewport(instance, enabledElement, imageId);
            cornerstone.setViewport(element, instanceClassViewport);
        }
    }

    // Resize each viewport element
    resizeViewportElements() {
        this.relocateDialogs();

        setTimeout(() => {
            this.repositionStudySeriesQuickSwitch();

            const elements = $('.imageViewerViewport').not('.empty');
            elements.each((index, element) => {
                this.resizeViewportElement(element);
                this.resizeScrollbars(element);
            });
        }, 1);
    }

    // Function to override resizeViewportElements function
    setResizeViewportElement(resizeViewportElements) {
        this.resizeViewportElements = resizeViewportElements;
    }

    // Avoid doing DOM manipulation during the resize handler
    // because it is fired very often.
    // Resizing is therefore performed 100 ms after the resize event stops.
    handleResize() {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            OHIF.log.info('ResizeViewportManager resizeViewportElements');
            this.resizeViewportElements();
        }, 100);
    }

    /**
     * Returns a unique event handler function associated with a given instance using lazy assignment.
     * @return {function} Returns a unique copy of the event handler of this class.
     */
    getResizeHandler() {
        let resizeHandler = this._resizeHandler;
        if (resizeHandler === null) {
            resizeHandler = this.handleResize.bind(this);
            this._resizeHandler = resizeHandler;
        }

        return resizeHandler;
    }
}
