import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { OHIF } from 'meteor/ohif:core';

import { OHIFPlugin } from "./OHIFPlugin";

export class ViewportPlugin extends OHIFPlugin {
    constructor(name) {
        super();

        this.name = name;
        this._destroyed = false;

        this._setupListeners();
    }

    /**
     * Retrieve a Display Set for a specific viewport by viewport index,
     * if one is already displayed in the viewport.
     *
     * @static
     * @param {Number} viewportIndex
     * @return {undefined|ImageSet}
     */
    static getDisplaySet(viewportIndex) {
        // TODO: Move layoutManager from viewerbase to viewer
        const { layoutManager } = OHIF.viewerbase;
        const viewportData = layoutManager.viewportData[viewportIndex];
        const { studyInstanceUid, displaySetInstanceUid } = viewportData;
        const studyMetadata = OHIF.viewer.StudyMetadataList.findBy({ studyInstanceUID: studyInstanceUid });

        return studyMetadata.findDisplaySet(displaySet => {
            return displaySet.displaySetInstanceUid === displaySetInstanceUid;
        });
    }

    /**
     * Set up the viewport using the plugin.
     *
     * This should be implemented by the child class.
     *
     * @abstract
     *
     * @param {HTMLElement} div
     * @param {ImageSet} displaySet
     * @param {Object} viewportDetails
     */
    setupViewport(div, displaySet, viewportDetails) {
        throw new Error('You must override this method!');
    }

    /**
     * Switch a single viewport to use the current ViewportPlugin
     *
     * @param {Number} viewportIndex The viewport to switch to the current plugin type
     */
    setViewportToPlugin(viewportIndex) {
        if (!this.name) {
            throw new Error('ViewportPlugin subclasses must have a name');
        }

        const { layoutManager } = OHIF.viewerbase;

        layoutManager.viewportData[viewportIndex].plugin = this.name;
        layoutManager.updateViewports();
    }

    /**
     * Runs 'setupViewport' for the ViewportPlugin on all viewports which should
     * be rendered by this plugin.
     *
     * @private
     */
    _setupAllPluginViewports() {
        if (!this.name) {
            throw new Error('ViewportPlugin subclasses must have a name');
        }

        const pluginDivs = document.querySelectorAll(`.viewport-plugin-${this.name}`);
        const allViewports = Array.from(document.querySelectorAll('.viewportContainer'));

        pluginDivs.forEach(div => {
            if (div.innerText !== '') {
                return;
            }

            const viewportIndex = allViewports.indexOf(div.parentNode);
            const viewportDetails = { viewportIndex };
            const displaySet = ViewportPlugin.getDisplaySet(viewportIndex);

            this.setupViewport(div, viewportDetails, displaySet);
        });
    }

    /**
     * Listen for changes to the viewport layout which would necessitate a
     * rerendering of the viewports. When this happens, re-render all viewports
     * which are using this plugin.
     *
     * @private
     */
    _setupListeners() {
        if (!this.name) {
            throw new Error('ViewportPlugin subclasses must have a name');
        }

        // TODO: Stop using Meteor's reactivity here
        Tracker.autorun((computation) => {
            Session.get('LayoutManagerUpdated');

            // In case we need to disable the use
            // of this plugin, we can also stop the
            // reactive computation by setting
            // this.destroyed to true.
            if (this._destroyed === true) {
                computation.stop();
            }

            // After the template rendering has finished,
            // identify all viewports which should be
            // rendered by the ViewportPlugin, and render
            // them.
            Tracker.afterFlush(() => {
                this._setupAllPluginViewports();
            });
        });
    }

    /**
     * Stop listening for changes to the viewport layout in order to
     * automatically rerender viewports setup for use by this plugin.
     */
    stopListeners() {
        this._destroyed = true;
    }
}
