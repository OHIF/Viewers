import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

OHIF.ui.unsavedChanges = (function() {

    const rootTree = {};

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

    function addNode(tree, path) {

        let node,
            result = false,
            name = path.shift();

        if (name !== '*') { // "*" is a special name which means "all children"
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
        set: function(name) {
            return typeof name === 'string' ? addNode(rootTree, name.split('.')) : false;
        },
        clear: function(name) {
            return typeof name === 'string' ? removeNode(rootTree, name.split('.')) : false;
        },
        probe: function(name) {
            return typeof name === 'string' ? probeNode(rootTree, name.split('.')) : 0;
        },
        check: function(name, options) {
            return new Promise((resolve, reject) => {
                let probe = this.probe(name);
                if (probe > 0) {
                    let dialogOptions = _.extend({
                        title: 'You have unsaved changes!',
                        message: "Your changes will be lost if you don't save them... Are you sure you want to proceed?"
                    }, options);
                    OHIF.ui.showFormDialog('dialogConfirm', dialogOptions).then(resolve, reject);
                } else {
                    resolve();
                }
            });
        }
    };

}());
