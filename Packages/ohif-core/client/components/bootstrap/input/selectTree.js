import { OHIF } from 'meteor/ohif:core';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

// TODO: use npm dependency
import transition from 'meteor/ohif:core/client/lib/third-party/transition-to-from-auto';

Template.selectTree.onCreated(() => {
    const instance = Template.instance();

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

    // Set the margin to display the common section
    $treeRoot.children('.tree-content').css('margin-right', $treeRoot.width());

    // Make the component respect the window boundaries
    $treeRoot.bounded();

    // Check if the component will be rendered on a specific position
    const position = instance.data.position;
    if (position) {
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
    instance.updateHeight = searchTerm => {
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
        rootInstance.$('.tree-options:first').height(height);
    };

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
    'click .select-tree-root>.tree-content'(event, instance) {
        // Get the tree root
        const $treeRoot = $(event.currentTarget).closest('.select-tree-root');

        // Detect the first interaction with the component and do the animation
        $treeRoot.addClass('interacted');

        // Remove the margin after the common section is closed
        $treeRoot.children('.tree-content').css('margin-right', '');
    },

    'input .tree-search input'(event, instance) {
        // Change the search term to update the tree items
        instance.searchTerm.set($(event.currentTarget).val());
    },

    'change .select-tree:first>.tree-content>.tree-options>.tree-inputs>label>input'(event, instance) {
        const component = instance.component;
        const $target = $(event.target);
        const $label = $target.closest('label');
        const eventComponent = $target.data('component');
        const rootComponent = instance.data.root || component;
        const rootInstance = rootComponent.templateInstance;

        // Change the component's node
        component.node(eventComponent.value());

        // Unset the active leaf
        rootInstance.$('label').removeClass('active').css('width', '');

        // Unset the selected state
        instance.setSelected(false);

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

                // Set the selected leaf value in the root component
                const itemData = $target.data('component').templateInstance.data.itemData;
                rootComponent.value(itemData);

                // Updata the stored data with the new count
                OHIF.user.setData(storageKey, storedData);
            }

            // Mark the component as selected
            instance.setSelected(true);
        } else {
            // Get the position of the clicked element
            const position = $label.position();

            Meteor.defer(() => {
                const $treeNode = $label.parent().siblings('.select-tree');

                // Do the transition from the clicked position to top
                $treeNode.css(position);
                setTimeout(() => $treeNode.css('top', 0));
            });
        }
    },

    'click .select-tree:first>.tree-content>.tree-options>.tree-breadcrumb .tree-back'(event, instance) {
        const rootComponent = instance.data.root || instance.component;
        const rootInstance = rootComponent.templateInstance;

        // Prevent the default element action
        event.preventDefault();

        // Reset the checked inputs to unchecked state
        rootInstance.$('input').removeAttr('checked');

        // Unset the selected state
        instance.setSelected(false);

        // Get the index of the breadcrumb's clicked option
        const index = $(event.currentTarget).attr('data-index') | 0;

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
        }

        // Return the tree items
        return items;
    }
});
