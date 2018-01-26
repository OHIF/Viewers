import { Tracker } from 'meteor/tracker';
import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

const FUNCTION = 'function';
const STRING = 'string';
const UNDEFINED = 'undefined';
const WILDCARD = '*'; // "*" is a special name which means "all children".
const SEPARATOR = '.';

/**
 * Main Namespace Component Class
 */

class Node {

    constructor() {
        this.value = 0;
        this.children = {};
        this.handlers = {};
    }

    getPathComponents(path) {
        return typeof path === STRING ? path.split(SEPARATOR) : null;
    }

    getNodeUpToIndex(path, index) {

        let node = this;

        for (let i = 0; i < index; ++i) {
            let item = path[i];
            if (node.children.hasOwnProperty(item)) {
                node = node.children[item];
            } else {
                node = null;
                break;
            }
        }

        return node;

    }

    append(name, value) {

        const children = this.children;
        let node = null;

        if (children.hasOwnProperty(name)) {
            node = children[name];
        } else if (typeof name === STRING && name !== WILDCARD) {
            node = new Node();
            children[name] = node;
        }

        if (node !== null) {
            node.value += value > 0 ? parseInt(value) : 0;
        }

        return node;

    }

    probe(recursively) {

        let value = this.value;

        // Calculate entire tree value recursively?
        if (recursively === true) {
            const children = this.children;
            for (let item in children) {
                if (children.hasOwnProperty(item)) {
                    value += children[item].probe(recursively);
                }
            }
        }

        return value;

    }

    clear(recursively) {

        this.value = 0;

        // Clear entire tree recursively?
        if (recursively === true) {
            const children = this.children;
            for (let item in children) {
                if (children.hasOwnProperty(item)) {
                    children[item].clear(recursively);
                }
            }
        }

    }

    appendPath(path, value) {

        path = this.getPathComponents(path);

        if (path !== null) {
            const last = path.length - 1;
            let node = this;
            for (let i = 0; i < last; ++i) {
                node = node.append(path[i], 0);
                if (node === null) {
                    return false;
                }
            }

            return (node.append(path[last], value) !== null);
        }

        return false;

    }

    clearPath(path, recursively) {

        path = this.getPathComponents(path);

        if (path !== null) {
            const last = path.length - 1;
            let node = this.getNodeUpToIndex(path, last);
            if (node !== null) {
                let item = path[last];
                if (item !== WILDCARD) {
                    if (node.children.hasOwnProperty(item)) {
                        node.children[item].clear(recursively);
                        return true;
                    }
                } else {
                    const children = node.children;
                    for (item in children) {
                        if (children.hasOwnProperty(item)) {
                            children[item].clear(recursively);
                        }
                    }

                    return true;
                }
            }
        }

        return false;

    }

    probePath(path, recursively) {

        path = this.getPathComponents(path);

        if (path !== null) {
            const last = path.length - 1;
            let node = this.getNodeUpToIndex(path, last);
            if (node !== null) {
                let item = path[last];
                if (item !== WILDCARD) {
                    if (node.children.hasOwnProperty(item)) {
                        return node.children[item].probe(recursively);
                    }
                } else {
                    const children = node.children;
                    let value = 0;
                    for (item in children) {
                        if (children.hasOwnProperty(item)) {
                            value += children[item].probe(recursively);
                        }
                    }

                    return value;
                }
            }
        }

        return 0;

    }

    attachHandler(type, handler) {

        let result = false;

        if (typeof type === STRING && typeof handler === FUNCTION) {

            const handlers = this.handlers;
            const list = handlers.hasOwnProperty(type) ? handlers[type] : (handlers[type] = []);
            const length = list.length;

            let notFound = true;

            for (let i = 0; i < length; ++i) {
                if (handler === list[i]) {
                    notFound = false;
                    break;
                }
            }

            if (notFound) {
                list[length] = handler;
                result = true;
            }

        }

        return result;

    }

    removeHandler(type, handler) {

        let result = false;

        if (typeof type === STRING && typeof handler === FUNCTION) {

            const handlers = this.handlers;
            if (handlers.hasOwnProperty(type)) {
                const list = handlers[type];
                const length = list.length;
                for (let i = 0; i < length; ++i) {
                    if (handler === list[i]) {
                        list.splice(i, 1);
                        result = true;
                        break;
                    }
                }
            }

        }

        return result;

    }

    trigger(type, nonRecursively) {

        if (typeof type === STRING) {

            const handlers = this.handlers;

            if (handlers.hasOwnProperty(type)) {
                const list = handlers[type];
                const length = list.length;
                for (let i = 0; i < length; ++i) {
                    list[i].call(null);
                }
            }

            if (nonRecursively !== true) {
                const children = this.children;
                for (let item in children) {
                    if (children.hasOwnProperty(item)) {
                        children[item].trigger(type);
                    }
                }
            }

        }

    }

    attachHandlerForPath(path, type, handler) {

        path = this.getPathComponents(path);

        if (path !== null) {
            let node = this.getNodeUpToIndex(path, path.length);
            if (node !== null) {
                return node.attachHandler(type, handler);
            }
        }

        return false;

    }

    removeHandlerForPath(path, type, handler) {

        path = this.getPathComponents(path);

        if (path !== null) {
            let node = this.getNodeUpToIndex(path, path.length);
            if (node !== null) {
                return node.removeHandler(type, handler);
            }
        }

        return false;

    }

    triggerHandlersForPath(path, type, nonRecursively) {

        path = this.getPathComponents(path);

        if (path !== null) {
            let node = this.getNodeUpToIndex(path, path.length);
            if (node !== null) {
                node.trigger(type, nonRecursively);
            }
        }

    }

}

/**
 * Root Namespace Node and API
 */

const rootNode = new Node();

export const unsavedChanges = {

    rootNode: rootNode,

    observer: new Tracker.Dependency(),

    hooks: new Map(),

    /**
     * Register a reactive dependency on every change any path suffers
     */
    depend: function() {
        return this.observer.depend();
    },

    /**
     * Signal an unsaved change for a given namespace.
     * @param {String} path A string (e.g., "viewer.studyViewer.measurements.targets") that identifies the namespace of the signaled changes.
     * @return {Boolean} Returns false if the signal could not be saved or the supplied namespace is invalid. Otherwise, true is returned.
     */
    set: function(path) {
        const result = rootNode.appendPath(path, 1);
        this.observer.changed();
        return result;
    },

    /**
     * Clear all signaled unsaved changes for a given namespace. If the supplied namespace is a wildcard, all signals below that namespace
     * are cleared.
     * @param {String} path A string that identifies the namespace of the signaled changes (e.g., "viewer.studyViewer.measurements.targets"
     *  for clearing the "targets" item of the "viewer.studyViewer.measurements" namespace or "viewer.studyViewer.*" to specify all signaled
     *  changes for the "viewer.studyViewer" namespace).
     * @param {Boolean} recursively Clear node and all its children recursively. If not specified defaults to true.
     * @return {Boolean} Returns false if the signal could not be removed or the supplied namespace is invalid. Otherwise, true is returned.
     */
    clear: function(path, recursively) {
        const result = rootNode.clearPath(path, typeof recursively === UNDEFINED ? true : recursively);
        this.observer.changed();
        return result;
    },

    /**
     * Count the amount of signaled unsaved changes for a given namespace. If the supplied namespace is a wildcard, all signals below that
     * namespace will also be accounted.
     * @param {String} path A string that identifies the namespace of the signaled changes (e.g., "viewer.studyViewer.measurements.targets"
     *  for counting the amount of signals for the "targets" item of the "viewer.studyViewer.measurements" namespace or "viewer.studyViewer.*"
     *  to count all signaled changes for the "viewer.studyViewer" namespace).
     * @param {Boolean} recursively Probe node and all its children recursively. If not specified defaults to true.
     * @return {Number} Returns the amount of signaled changes for a given namespace. If the supplied namespace is a wildcard, the sum of all
     *  changes for that namespace are returned.
     */
    probe: function(path, recursively) {
        return rootNode.probePath(path, typeof recursively === UNDEFINED ? true : recursively);
    },

    /**
     * Attach an event handler to the specified namespace.
     * @param {String} name A string that identifies the namespace to which the event handler will be attached (e.g.,
     *  "viewer.studyViewer.measurements" to attach an event handler for that namespace).
     * @param {String} type A string that identifies the event type to which the event handler will be attached.
     * @param {Function} handler The handler that will be executed when the specifed event is triggered.
     * @return {Boolean} Returns true on success and false on failure.
     */
    attachHandler: function(path, type, handler) {
        return (rootNode.appendPath(path, 0) && rootNode.attachHandlerForPath(path, type, handler));
    },

    /**
     * Detach an event handler from the specified namespace.
     * @param {String} name A string that identifies the namespace from which the event handler will be detached (e.g.,
     *  "viewer.studyViewer.measurements" to remove an event handler from that namespace).
     * @param {String} type A string that identifies the event type to which the event handler was attached.
     * @param {Function} handler The handler that will be removed from execution list.
     * @return {Boolean} Returns true on success and false on failure.
     */
    removeHandler: function(path, type, handler) {
        return rootNode.removeHandlerForPath(path, type, handler);
    },

    /**
     * Trigger all event handlers for the specified namespace and type.
     * @param {String} name A string that identifies the namespace from which the event handler will be detached (e.g.,
     *  "viewer.studyViewer.measurements" to remove an event handler from that namespace).
     * @param {String} type A string that identifies the event type which will be triggered.
     * @param {Boolean} nonRecursively If set to true, prevents triggering event handlers from descending tree.
     * @return {Void} No value is returned.
     */
    trigger: function(path, type, nonRecursively) {
        rootNode.triggerHandlersForPath(path, type, nonRecursively);
    },

    /**
     * UI utility that presents a confirmation dialog to the user if any unsaved changes where signaled for the given namespace.
     * @param {String} path A string that identifies the namespace of the signaled changes (e.g., "viewer.studyViewer.measurements.targets"
     *  for considering only the signals for the "targets" item of the "viewer.studyViewer.measurements" namespace or "viewer.studyViewer.*"
     *  to consider all signaled changes for the "viewer.studyViewer" namespace).
     * @param {Function} callback A callback function (e.g, function(shouldProceed, hasChanges) { ... }) that will be executed after assessment.
     *  Upon execution, the callback will receive two boolean arguments (shouldProceed and hasChanges) indicating if the action can be performed
     *  or not and if changes that need to be cleared exist.
     * @param {Object} options (Optional) An object with UI presentation options.
     * @param {String} options.title The string that will be used as a title for confirmation dialog.
     * @param {String} options.message The string that will be used as a message for confirmation dialog.
     * @return {void} No value is returned.
     */
    checkBeforeAction: function(path, callback, options) {

        let probe, hasChanges, shouldProceed;

        if (typeof callback !== 'function') {
            // nothing to do if no callback function is supplied...
            return;
        }

        probe = this.probe(path);
        if (probe > 0) {
            // Unsaved changes exist...
            hasChanges = true;
            let dialogOptions = _.extend({
                title: 'You have unsaved changes!',
                message: "Your changes will be lost if you don't save them before leaving the current page... Are you sure you want to proceed?"
            }, options);
            OHIF.ui.showDialog('dialogConfirm', dialogOptions).then(function() {
                // Unsaved changes exist but user confirms action...
                shouldProceed = true;
                callback.call(null, shouldProceed, hasChanges);
            }, function() {
                // Unsaved changes exist and user does NOT confirm action...
                shouldProceed = false;
                callback.call(null, shouldProceed, hasChanges);
            });
        } else {
            // No unsaved changes, action can be performed...
            hasChanges = false;
            shouldProceed = true;
            callback.call(null, shouldProceed, hasChanges);
        }

    },

    /**
     * UI utility that presents a "proactive" dialog (with three options: stay, abandon-changes, save-changes) to the user if any unsaved changes where signaled for the given namespace.
     * @param {String} path A string that identifies the namespace of the signaled changes (e.g., "viewer.studyViewer.measurements.targets"
     *  for considering only the signals for the "targets" item of the "viewer.studyViewer.measurements" namespace or "viewer.studyViewer.*"
     *  to consider all signaled changes for the "viewer.studyViewer" namespace).
     * @param {Function} callback A callback function (e.g, function(hasChanges, userChoice) { ... }) that will be executed after assessment.
     *  Upon execution, the callback will receive two arguments: one boolean (hasChanges) indicating that unsaved changes exist and one string with the ID of the
     *  option picked by the user on the dialog ('abort-action', 'abandon-changes' and 'save-changes'). If no unsaved changes exist, the second argument is null.
     * @param {Object} options (Optional) An object with UI presentation options.
     * @param {Object} options.position An object with optimal position (e.g., { x: ..., y: ... }) for the dialog.
     * @return {void} No value is returned.
     */
    presentProactiveDialog: function(path, callback, options) {

        let probe, hasChanges;

        if (typeof callback !== 'function') {
            // nothing to do if no callback function is supplied...
            return;
        }

        probe = this.probe(path, true);
        if (probe > 0) {
            // Unsaved changes exist...
            hasChanges = true;
            OHIF.ui.unsavedChangesDialog(function(choice) {
                callback.call(null, hasChanges, choice);
            }, options);
        } else {
            // No unsaved changes, action can be performed...
            hasChanges = false;
            callback.call(null, hasChanges, null);
        }

    },

    addHook(saveCallback, options={}) {
        _.defaults(options, {
            path: '*',
            message: 'There are unsaved changes'
        });

        this.hooks.set(saveCallback, options);
    },

    removeHook(saveCallback) {
        this.hooks.delete(saveCallback);
    },

    confirmNavigation(navigateCallback, event) {
        let dialogPresented = false;
        Array.from(this.hooks.keys()).every(saveCallback => {
            const options = this.hooks.get(saveCallback);
            const probe = this.probe(options.path, true);
            if (!probe) return true;

            const dialogOptions = Object.assign({ class: 'themed' }, options);
            if (event) {
                dialogOptions.position = {
                    x: event.clientX + 15,
                    y: event.clientY + 15
                };
            }

            OHIF.ui.unsavedChanges.presentProactiveDialog(options.path, (hasChanges, userChoice) => {
                if (!hasChanges) return;

                const clear = () => this.clear(options.path, true);
                switch (userChoice) {
                    case 'abort-action':
                        return;
                    case 'save-changes':
                        const result = saveCallback();
                        if (result instanceof Promise) {
                            return result.then(() => {
                                clear();
                                this.confirmNavigation(navigateCallback, event);
                            });
                        }

                        clear();
                        return this.confirmNavigation(navigateCallback, event);
                    case 'abandon-changes':
                        clear();
                        break;
                }

                navigateCallback();
            }, dialogOptions);

            dialogPresented = true;
            return false;
        });

        if (!dialogPresented) {
            navigateCallback();
        }
    }

};

OHIF.ui.unsavedChanges = unsavedChanges;
