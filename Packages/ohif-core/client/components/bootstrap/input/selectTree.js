import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

// TODO: use npm dependency
import transition from 'meteor/ohif:core/client/lib/third-party/transition-to-from-auto';

Template.selectTree.onRendered(() => {
    const instance = Template.instance();
    const component = instance.$('.select-tree:first').data('component');
    const rootComponent = instance.data.root || component;
    const rootInstance = rootComponent.templateInstance;
    const $treeRoot = rootInstance.$('.select-tree-root:first').first();

    instance.component = component;

    // Start the component transitions
    $treeRoot.addClass('started');

    // Update the component's viewport height
    instance.updateHeight = () => {
        const height = rootInstance.$('.tree-options:last').data('height');
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

        // Update the viewport height
        Tracker.afterFlush(() => {
            instance.updateHeight();
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
    'click .select-tree-root'(event, instance) {
        // Detect the first interaction with the component and do the animation
        $(event.currentTarget).addClass('interacted');
    },

    'change .select-tree:first>.tree-content>.tree-options>.tree-inputs>label>input'(event, instance) {
        const component = instance.component;
        const $target = $(event.target);
        const $label = $target.closest('label');
        const eventComponent = $target.data('component');
        const rootComponent = instance.data.root || component;
        const rootInstance = rootComponent.templateInstance;

        // Change the component's value
        component.value(eventComponent.value());

        // Unset the active leaf
        rootInstance.$('label').removeClass('active');

        // Unset the selected state
        instance.setSelected(false);

        // Check if the clicked element is a node or a leaf
        const isLeaf = $label.hasClass('tree-leaf');
        if (isLeaf) {
            // Change the active item
            $label.addClass('active');

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
