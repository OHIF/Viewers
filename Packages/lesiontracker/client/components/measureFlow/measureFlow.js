import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

Template.measureFlow.onCreated(() => {
    const instance = Template.instance();

    instance.state = new ReactiveVar('closed');
    instance.description = new ReactiveVar('');
    instance.descriptionEdit = new ReactiveVar(false);

    instance.items = [{
        label: 'Category 1',
        value: 'Category 1',
        items: [{
            label: 'Subcategory 1.1',
            value: 'Subcategory 1.1'
        }, {
            label: 'Subcategory 1.2',
            value: 'Subcategory 1.2',
            items: [{
                label: 'Subcategory 1.2.1',
                value: 'Subcategory 1.2.1'
            }, {
                label: 'Subcategory 1.2.2',
                value: 'Subcategory 1.2.2',
                items: [{
                    label: 'Subcategory 1.2.2.1',
                    value: 'Subcategory 1.2.2.1'
                }, {
                    label: 'Subcategory 1.2.2.2',
                    value: 'Subcategory 1.2.2.2'
                }]
            }]
        }]
    }, {
        label: 'Category 2',
        value: 'Category 2',
        items: [{
            label: 'Subcategory 2.1',
            value: 'Subcategory 2.1'
        }, {
            label: 'Subcategory 2.2',
            value: 'Subcategory 2.2'
        }, {
            label: 'Subcategory 2.3',
            value: 'Subcategory 2.3'
        }]
    }, {
        label: 'Category 3',
        value: 'Category 3'
    }];

    const items = [
        'Abdomen/Chest Wall',
        'Adrenal',
        'Bladder',
        'Bone',
        'Brain',
        'Breast',
        'Colon',
        'Esophagus',
        'Extremities',
        'Gallbladder',
        'Kidney',
        'Liver',
        'Lung',
        'Lymph Node',
        'Mediastinum/Hilum',
        'Muscle',
        'Neck',
        'Other Soft Tissue',
        'Ovary',
        'Pancreas',
        'Pelvis',
        'Peritoneum/Omentum',
        'Prostate',
        'Retroperitoneum',
        'Small Bowel',
        'Spleen',
        'Stomach',
        'Subcutaneous'
    ];

    instance.items = [];
    _.each(items, item => {
        instance.items.push({
            label: item,
            value: item
        });
    });

    const commonItems = [
        'Abdomen/Chest Wall',
        'Lung',
        'Lymph Node',
        'Liver',
        'Mediastinum/Hilum',
        'Pelvis',
        'Peritoneum/Omentum',
        'Retroperitoneum'
    ];

    instance.commonItems = [];
    _.each(commonItems, item => {
        instance.commonItems.push({
            label: item,
            value: item
        });
    });
});

Template.measureFlow.onRendered(() => {
    const instance = Template.instance();

    // Make the measure flow bounded by the window borders
    instance.$('.measure-flow').bounded();
});

Template.measureFlow.events({
    'click .measure-flow .btn-add, click .measure-flow .btn-rename'(event, instance) {
        // Set the open state for the component
        instance.state.set('open');

        // Wait template rerender before rendering the selectTree
        Tracker.afterFlush(() => {
            // Get the click position
            const position = {
                left: event.clientX,
                top: event.clientY,
            };

            // Define the data for selectTreeComponent
            const data = {
                key: 'label',
                items: instance.items,
                commonItems: instance.commonItems,
                hideCommon: instance.data.hideCommon,
                label: 'Assign label',
                searchPlaceholder: 'Search labels',
                storageKey: 'measureLabelCommon',
                treeColumns: instance.data.treeColumns,
                position
            };

            // Define in which element the selectTree will be rendered in
            const parentElement = instance.$('.measure-flow')[0];

            // Render the selectTree element
            instance.selectTreeView = Blaze.renderWithData(Template.selectTree, data, parentElement);
        });
    },

    'click .measure-flow .btn-description'(event, instance) {
        // Fade out the action buttons
        instance.$('.measure-flow .actions').addClass('fadeOut');

        // Set the description edit mode
        instance.descriptionEdit.set(true);

        // Wait for DOM re-rendering, resize and focus the description textarea
        Tracker.afterFlush(() => {
            const $textarea = instance.$('textarea');
            $textarea.trigger('input').focus();
        });
    },

    'input textarea, change textarea'(event, instance) {
        const element = event.currentTarget;
        const $element = $(element);

        // Resize the textarea based on its content length
        $element.css('max-height', 0);
        $element.height(element.scrollHeight);
        $element.css('max-height', '');

        // Reposition the measure flow if needed
        const $measureFlow = instance.$('.measure-flow');
        $element.one('transitionend', () => $measureFlow.trigger('spatialChanged'));
    },

    'keydown textarea'(event, instance) {
        // Unset the description edit mode if ENTER or ESC was pressed
        if (event.which === 13 || event.which === 27) {
            instance.$('.measure-flow .actions').removeClass('fadeOut');
            instance.descriptionEdit.set(false);
        }

        // Keep the current description if ENTER was pressed
        if (event.which === 13) {
            instance.description.set($(event.currentTarget).val());
        }
    },

    'click .select-tree-common label'(event, instance) {
        // Set the common section clicked flag
        instance.commonClicked = true;
    },

    'change .select-tree-root'(event, instance) {
        // Stop here if it's an inner input event
        if (event.target !== event.currentTarget) {
            return;
        }

        // Store the selectTree component value before it's removed from DOM
        const $treeRoot = $(event.currentTarget);
        instance.value = $treeRoot.data('component').value();
    },

    'click .tree-leaf input'(event, instance) {
        const $target = $(event.currentTarget);
        const $label = $target.closest('label');
        const $treeRoot = $label.closest('.select-tree-root');
        const $container = $treeRoot.find('.tree-options:first');

        // Check if the targe click was a label inside common section
        if (instance.commonClicked) {
            const labelTop = $label.position().top;
            const containerCenter = Math.round($container.height() / 2);
            const labelCenter = Math.round($label.height() / 2);

            // Scroll the options container to make the target input visible
            $container.scrollTop(labelTop - containerCenter + labelCenter);
        }

        // Change the measure flow state to selected
        instance.state.set('selected');

        // Get the clicked label window offset
        const labelOffset = $label.offset();

        // Wait for the DOM re-rendering
        Tracker.afterFlush(() => {
            // Get the measure flow div
            const $measureFlow = instance.$('.measure-flow');

            // Subtract the label box shadow height from the label's position
            labelOffset.top -= 10;

            // Reposition the measure flow based on the clicked label position
            $measureFlow.css(labelOffset);

            // Resize the copied label with same width of the clicked one
            $measureFlow.children('.tree-leaf').width($label.outerWidth());
        });

        // Wait the fade-out transition and remove the selectTree component
        $container.one('transitionend', event => Blaze.remove(instance.selectTreeView));
    }
});
