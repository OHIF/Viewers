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
        const viewportData = layoutManager.viewportData[viewportIndex];
        if (viewportData.plugin === this.name) {
            OHIF.log.info(`setViewportToPlugin: Viewport ${viewportIndex} already set to plugin ${this.name}`);
        }

        viewportData.plugin = this.name;

        layoutManager.rerenderViewportWithNewDisplaySet(viewportIndex, viewportData);
    }

    /**
     * Runs 'setupViewport' for the ViewportPlugin on all viewports which should
     * be rendered by this plugin, but have not yet been initialized. Viewports
     * which already contain contents are skipped.
     *
     * @private
     */
    _initEmptyPluginViewports() {
        if (!this.name) {
            throw new Error('ViewportPlugin subclasses must have a name');
        }

        // Find all Viewport HTMLElements currently using this plugin
        const pluginDivs = Array.from(document.querySelectorAll(`.viewport-plugin-${this.name}`));

        // If there are no Viewports using this plugin, stop here
        if (!pluginDivs.length) {
            return;
        }

        const emptyPluginDivs = pluginDivs.filter(div => {
            // Keep only divs owned by the plugin which have no contents
            return div.innerHTML.trim() === '';
        });

        OHIF.log.info(`${this.name}: Initializing ${emptyPluginDivs.length} viewports`);

        // Retrieve the list of all viewports, so we can figure out the viewport details
        const allViewports = Array.from(document.querySelectorAll('.viewportContainer'));

        const { layoutManager } = OHIF.viewerbase;

        emptyPluginDivs.forEach(div => {
            // Identify the Viewport index, and any display set that is currently
            // hung in the viewport
            const viewportIndex = allViewports.indexOf(div.parentNode);
            const viewportData = layoutManager.viewportData[viewportIndex];
            const displaySet = ViewportPlugin.getDisplaySet(viewportIndex);

            // Use the plugin's setupViewport function to render the contents
            // of this viewport.
            this.setupViewport(div, viewportData, displaySet);
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

        console.warn(`_setupListeners: ${this.name}`);

        // TODO: Stop using Meteor's reactivity here
        Tracker.autorun((computation) => {
            const random = Session.get('LayoutManagerUpdated');
            console.warn(`LayoutManagerUpdated: ${this.name}: ${random}`);

            // Bail out if this is the first time the autorun
            // executes (i.e. when it is being defined).
            //
            // Note: This has to be checked after the dependency on the
            // Session variable above, or the reactive dependency will not
            // be established.
            if (computation.firstRun === true) {
                return;
            }

            // In case we need to disable the use
            // of this plugin, we can also stop the
            // reactive computation by setting
            // this.destroyed to true.
            if (this._destroyed === true) {
                computation.stop();
            }

            // Identify all viewports which should be
            // rendered by the ViewportPlugin, and render
            // them.
            this._initEmptyPluginViewports();
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
