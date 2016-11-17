import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

OHIF.ui.unsavedChanges = (function(OHIF, _) {

    // Root of the internal Namespace tree.
    const rootTree = {};

    // Create an unattached namespace node be later appended to the Namespace tree.
    function createNode(name, hasChildren) {

        let node = { name };

        if (hasChildren) {
            node.type = 'tree';
            node.children = {};
        } else {
            node.type = 'leaf';
            node.value = 1;
        }

        return node;

    }

    // Attach a new node (identified by a namespace string) to the Namespace tree or increment its internal signal count.
    function addNode(tree, path) {

        let node,
            result = false,
            name = path.shift();

        if (name !== '*') { // "*" is a special name which means "all children" and thus CANNOT be used.
            if (name in tree) {
                node = tree[name];
                if (path.length > 0) {
                    result = node.type === 'tree' && addNode(node.children, path);
                } else if (node.type === 'leaf') {
                    node.value++;
                    result = true;
                }
            } else {
                node = createNode(name, path.length > 0);
                if (node.type !== 'tree' || addNode(node.children, path)) {
                    tree[name] = node;
                    result = true;
                }
            }
        }

        return result;

    }

    // Detach a node (identified by a namespace string) from the internal Namespace tree consequently clearing its internal signal count.
    // ... The supplied namespace can be a wildcard, in which case all sub-nodes are removed as well.
    function removeNode(tree, path) {

        let result = false,
            name = path.shift();

        if (name === '*') {
            for (name in tree) {
                if (tree.hasOwnProperty(name)) {
                    delete tree[name];
                }
            }

            result = true;
        } else if (name in tree) {
            if (path.length === 0) {
                delete tree[name];
                result = true;
            } else {
                let node = tree[name];
                if (node.type === 'tree') {
                    result = removeNode(node.children, path);
                }
            }
        }

        return result;

    }

    // Count the amount of signals registered for a given node.
    // ... The supplied namespace can be a wildcard, in which case the resulting value will consider the counter of all sub-nodes.
    function probeNode(tree, path) {

        let node,
            result = 0,
            name = path.shift();

        if (name === '*') {
            for (name in tree) {
                if (tree.hasOwnProperty(name)) {
                    node = tree[name];
                    if (node.type === 'leaf') {
                        result += node.value;
                    } else {
                        path.unshift('*');
                        result += probeNode(node.children, path);
                    }
                }
            }
        } else if (name in tree) {
            node = tree[name];
            if (node.type === 'tree') {
                if (path.length === 0) {
                    path.unshift('*');
                }

                result = probeNode(node.children, path);
            } else {
                result = path.length === 0 ? node.value : 0;
            }
        }

        return result;

    }

    // return the exposed interface of UnsavedChanges object
    return {

        /**
         * Signal an unsaved change for a given namespace.
         * @param {String} name A string (e.g., "viewer.studyViewer.measurements.targets") that identifies the namespace of the signaled changes.
         * @return {Boolean} Returns false if the signal could not be saved or the supplied namespace is invalid. Otherwise, true is returned.
         */
        set: function(name) {
            return typeof name === 'string' ? addNode(rootTree, name.split('.')) : false;
        },

        /**
         * Clear all signaled unsaved changes for a given namespace. If the supplied namespace is a wildcard, all signals below that namespace
         * are cleared.
         * @param {String} name A string that identifies the namespace of the signaled changes (e.g., "viewer.studyViewer.measurements.targets"
         *  for clearing the "targets" item of the "viewer.studyViewer.measurements" namespace or "viewer.studyViewer.*" to specify all signaled
         *  changes for the "viewer.studyViewer" namespace).
         * @return {Boolean} Returns false if the signal could not be removed or the supplied namespace is invalid. Otherwise, true is returned.
         */
        clear: function(name) {
            return typeof name === 'string' ? removeNode(rootTree, name.split('.')) : false;
        },

        /**
         * Count the amount of signaled unsaved changes for a given namespace. If the supplied namespace is a wildcard, all signals below that
         * namespace will also be accounted.
         * @param {String} name A string that identifies the namespace of the signaled changes (e.g., "viewer.studyViewer.measurements.targets"
         *  for counting the amount of signals for the "targets" item of the "viewer.studyViewer.measurements" namespace or "viewer.studyViewer.*"
         *  to count all signaled changes for the "viewer.studyViewer" namespace).
         * @return {Number} Returns the amount of signaled changes for a given namespace. If the supplied namespace is a wildcard, the sum of all
         *  changes for that namespace are returned.
         */
        probe: function(name) {
            return typeof name === 'string' ? probeNode(rootTree, name.split('.')) : 0;
        },

        /**
         * UI utility that presents a confirmation dialog to the user if any unsaved changes where sinaled for the given namespace.
         * @param {String} name A string that identifies the namespace of the signaled changes (e.g., "viewer.studyViewer.measurements.targets"
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
        checkBeforeAction: function(name, callback, options) {

            let probe, hasChanges, shouldProceed;

            if (typeof callback !== 'function') {
                // nothing to do if no callback function is supplied...
                return;
            }

            probe = this.probe(name);
            if (probe > 0) {
                // Unsaved changes exist...
                hasChanges = true;
                let dialogOptions = _.extend({
                    title: 'You have unsaved changes!',
                    message: "Your changes will be lost if you don't save them before leaving the current page... Are you sure you want to proceed?"
                }, options);
                OHIF.ui.showFormDialog('dialogConfirm', dialogOptions).then(function() {
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

        }

    };

}(OHIF, _));
