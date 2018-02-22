import { OHIF } from 'meteor/ohif:core';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

// TODO: use npm dependency
import transition from 'meteor/ohif:core/client/lib/third-party/transition-to-from-auto';

Template.selectTree.onCreated(() => {
    const instance = Template.instance();

    // Return the common items
    instance.getCommonItems = () => {
        const instance = Template.instance();

        // Return the common items if given
        if (instance.data.commonItems) {
            return instance.data.commonItems;
        }

        // Get all the tree leaves
        const leaves = instance.data.component.getLeaves();

        // Generate an object with encoded keys from the tree leaves
        const leavesObject = {};
        _.each(leaves, leaf => {
            leavesObject[OHIF.string.encodeId(leaf.value)] = leaf;
        });

        // Get the current items ranking
        const ranking = OHIF.user.getData(instance.data.storageKey);

        // Sort the items based on how many times each one was used
        const sorted = [];
        _.each(ranking, (count, key) => sorted.push([key, count]));
        sorted.sort((a, b) => b[1] - a[1]);

        // Create the result and push every item respecting the ranking order
        const result = [];
        _.each(sorted, item => {
            const current = leavesObject[item[0]];
            if (current) {
                result.push(current);
            }
        });

        // Return the resulting array
        return result;
    };

    // Create a reactive variable to control the search
    instance.searchTerm = new ReactiveVar('');
});

Template.selectTree.onRendered(() => {
    const instance = Template.instance();
    const component = instance.$('.select-tree:first').data('component');
    const rootComponent = instance.data.root || component;
    const rootInstance = rootComponent.templateInstance;
    const $treeRoot = rootInstance.$('.select-tree-root:first').first();

    instance.component = component;

    // Force to hardware acceleration to move element if browser supports translate property
    instance.useTransform = OHIF.ui.styleProperty.check('transform', 'translate(1px, 1px)');

    // Set the margin property and width
    const isthreeColumns = instance.data.threeColumns;
    if (!rootInstance.marginProperty) {
        rootInstance.marginProperty = isthreeColumns ? 'margin-left' : 'margin-right';
        rootInstance.marginWidth = isthreeColumns ? $treeRoot.width() / 2 : $treeRoot.width();
    }

    // Define a function to set the margin and toggle common section
    instance.setMargin = isHidden => {
        const marginWidth = isHidden ? '' : rootInstance.marginWidth;
        $treeRoot.children('.tree-content').css(rootInstance.marginProperty, marginWidth);
    };

    // Set the margin to display the common section
    if (!$treeRoot.hasClass('started')) {
        instance.setMargin(false);
    }

    // Make the component respect the window boundaries
    if (rootComponent === component) {
        $treeRoot.bounded();
    }

    // Check if the component will be rendered on a specific position
    const position = instance.data.position;
    if (component === rootComponent && position) {
        // Get the dimensions and move it with the given position as its center
        const width = $treeRoot.outerWidth();
        const height = $treeRoot.outerHeight();
        position.left -= Math.round(width / 2);
        position.top -= Math.round(height / 2);

        // Change the component's position and trigger the bounded event
        $treeRoot.css(_.extend({}, position, {
            position: 'fixed'
        })).trigger('spatialChanged');
    }

    Meteor.defer(() => {
        // Start the component transitions
        $treeRoot.addClass('started');

        // Focus the search box
        $treeRoot.find('.tree-search input').focus();
    });

    // Update the component's viewport height
    instance.updateHeight = _.throttle(searchTerm => {
        let height;

        // Check if there's a search term
        if (searchTerm) {
            // Set the viewport height as same as listed options height
            height = rootInstance.$('.tree-inputs').height();
        } else {
            // Set the viewport height as same as selected node's options height
            height = rootInstance.$('.tree-options:last').data('height');
        }

        // Update the viewport's height
        rootInstance.$('.tree-options:first').first().height(height);
    }, 100, { trailing: false });

    // Update the opened node
    instance.updateOpen = () => {
        rootInstance.$('.select-tree').removeClass('open');
        rootInstance.$('.select-tree:last').addClass('open');
    };

    // Put the component in selected state
    instance.setSelected = (flag) => {
        if (flag) {
            $treeRoot.addClass('selected');
        } else {
            $treeRoot.removeClass('selected');
        }
    };

    // Store the element's initial height
    const $treeOptions = instance.$('.tree-options:first').first();
    const height = $treeOptions.height();
    $treeOptions.data('height', height);

    $treeOptions.off('transitionend').on('transitionend', event => {
        if (event.target !== event.currentTarget) return;
        $treeRoot.trigger('spatialChanged');
    });

    instance.autorun(() => {
        // Run this computation everytime the current node is changed
        instance.data.currentNode.dep.depend();

        // Run this computation everytime the search term is changed
        const searchTerm = instance.searchTerm.get();

        // Clean the current node selection if the user started the search
        if (searchTerm) {
            rootInstance.data.currentNode.set(null);
        }

        // Update the viewport height
        Tracker.afterFlush(() => {
            instance.updateHeight(searchTerm);
            instance.updateOpen();
        });
    });

    const selector = '.select-tree:first>.tree-content>.tree-options>.tree-breadcrumb .path-link';
    instance.$(selector).css('width', 0).each((index, element) => {
        transition({
            element: element,
            prop: 'width',
            style: 'width 0.3s ease',
            val: 'auto'
        });
    });
});

Template.selectTree.events({
    'input .tree-search input'(event, instance) {
        const $target = $(event.currentTarget);
        // Get the tree root
        const $treeRoot = $target.closest('.select-tree-root');

        // Get the search term
        const searchTerm = $target.val();

        // Change the search term to update the tree items
        instance.searchTerm.set(searchTerm);

        // Change the component state
        const method = searchTerm ? 'addClass' : 'removeClass';
        $treeRoot[method]('navigated');
        instance.setMargin(!!searchTerm);
    },

    'keydown .tree-search input'(event, instance) {
        // Get the search term
        const searchTerm = $(event.currentTarget).val().trim();

        const $labels = instance.$('.tree-inputs:first>label');

        // Select the label if ENTER was pressed and there is only one result
        if (searchTerm.length && $labels.length === 1 && event.which === 13) {
            $labels.find('input').click();
        }
    },

    'change .select-tree:first>.tree-content>.tree-options>.tree-inputs>label>input'(event, instance) {
        const component = instance.component;
        const $target = $(event.currentTarget);
        const $treeRoot = $target.closest('.select-tree-root');
        const $label = $target.closest('label');
        const eventComponent = $target.data('component');
        const rootComponent = instance.data.root || component;
        const rootInstance = rootComponent.templateInstance;
        const offsetTop = $target.closest('.wrapperLabel').offset().top;

        // Change the component's node
        component.node(eventComponent.value());

        // Unset the active leaf
        rootInstance.$('label').removeClass('active').css('width', '');

        // Unset the selected state
        instance.setSelected(false);

        // Detect the first interaction with the component and do the animation
        instance.setMargin(true);
        $treeRoot.addClass('navigated');

        // Check if the clicked element is a node or a leaf
        const isLeaf = $label.hasClass('tree-leaf');
        if (isLeaf) {
            // Change the active item
            $label.css('width', $label.outerWidth()).addClass('active');

            // Ckeck if there's a storageKey defined
            const storageKey = instance.data.storageKey;
            if (storageKey) {
                // Get the current stored data
                const storedData = _.extend({}, OHIF.user.getData(storageKey));

                // Increment or create a counter for the clicked leaf
                const itemKey = OHIF.string.encodeId($target.val());
                if (storedData[itemKey]) {
                    storedData[itemKey]++;
                } else {
                    storedData[itemKey] = 1;
                }

                // Update the stored data with the new count
                OHIF.user.setData(storageKey, storedData);
            }

            // Set the selected leaf value in the root component
            const itemData = $target.data('component').templateInstance.data.itemData;
            rootComponent.value(itemData);

            // Mark the component as selected
            instance.setSelected(true);
        } else {
            // Get the position of the clicked element
            const position = $label.position();

            const getPosition = $element => {
                if (instance.useTransform) {
                    const matrixToArray = str => str.match(/(-?[0-9\.]+)/g);
                    const transformMatrix = matrixToArray($element.css('transform')) || [];
                    return {
                        x: parseFloat(transformMatrix[4]) || 0,
                        y: parseFloat(transformMatrix[5]) || 0
                    };
                } else {
                    return {
                        x: parseFloat($element.css('left')),
                        y: parseFloat($element.css('top'))
                    };
                }
            };

            const setPosition = ($element, position) => {
                if (instance.useTransform) {
                    const translation = `translate(${position.x}px, ${position.y}px)`;
                    OHIF.ui.styleProperty.set($element[0], 'transform', translation);
                } else {
                    $element.css('left', `${position.x}px`);
                    $element.css('top', `${position.y}px`);
                }
            };

            Meteor.defer(() => {
                const $treeNode = $label.parent().siblings('.select-tree');

                // Do the transition from the clicked position to top
                $treeNode.css(position);
                setTimeout(() => $treeNode.css('top', 0));

                const optionsTop = $target.closest('.tree-options').position().top;
                const treeOffsetTop = $treeRoot.offset().top;
                const treeRootPosition = getPosition($treeRoot);
                treeRootPosition.y += offsetTop - treeOffsetTop - optionsTop;
                setPosition($treeRoot, treeRootPosition);
            });
        }
    },

    'click .select-tree:first>.tree-content>.tree-options>.tree-breadcrumb .tree-back'(event, instance) {
        const $target = $(event.currentTarget);
        const rootComponent = instance.data.root || instance.component;
        const rootInstance = rootComponent.templateInstance;

        // Prevent the default element action
        event.preventDefault();

        // Reset the checked inputs to unchecked state
        rootInstance.$('input').removeAttr('checked');

        // Unset the selected state
        instance.setSelected(false);
        instance.setMargin(false);
        $target.closest('.select-tree-root').removeClass('navigated');

        // Get the index of the breadcrumb's clicked option
        const index = parseInt($target.attr('data-index'));

        // Set the current instance
        let currentInstance = instance.component.parent.templateInstance;

        // Iterate over all parents until gets into the clicked node
        for (let i = 1; i <= index; i++) {
            // Unset the selected node
            currentInstance.data.currentNode.set(null);

            // Check if it's not the root node
            if (i < index) {
                // Change the current instance
                currentInstance = currentInstance.component.parent.templateInstance;
            }
        }
    }
});

Template.selectTree.helpers({
    treeItems() {
        const instance = Template.instance();

        // Run this computation everytime the search term is changed
        const searchTerm = instance.searchTerm.get();

        // Get all the items
        let items = instance.data.items;

        // Check if the search term was informed
        if (searchTerm) {
            // Search the items by the give search term
            items = OHIF.string.search(items, searchTerm, 'label');

            // Filter only the tree leaves
            items = _.filter(items, item => !item.items);
        } else if (instance.data.hideCommon) {
            // Get the values of common items
            const commonValues = _.pluck(instance.getCommonItems(), 'value');

            // Filter only the items that are not common
            items = _.filter(items, item => !_.contains(commonValues, item.value));
        }

        // Return the items sorted for tree columns
        if (instance.data.threeColumns) {
            const begin = items.splice(0, Math.ceil(items.length / 2));
            const sortedItems = [];
            _.each(begin, (item, index) => {
                sortedItems.push(item);
                if (items[index]) {
                    sortedItems.push(items[index]);
                }
            });
            items = sortedItems;
        }

        // Return the tree items
        return items;
    }
});
