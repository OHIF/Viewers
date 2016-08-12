import { OHIF } from 'meteor/ohif:core';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

Template.measureFlow.onCreated(() => {
    const instance = Template.instance();

    instance.state = new ReactiveVar('closed');

    const items = [
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
        'Muscle',
        'Neck',
        'Other: Soft Tissue',
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
});

Template.measureFlow.events({
    'click .measure-flow .btn-add'(event, instance) {
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
                label: 'Assign label',
                searchPlaceholder: 'Search labels',
                storageKey: 'measureLabelCommon',
                position
            };

            // Define in which element the selectTree will be rendered in
            const parentElement = instance.$('.measure-flow')[0];

            // Render the selectTree element
            Blaze.renderWithData(Template.selectTree, data, parentElement);
        });
    },
    'click .select-tree-common label'(event, instance) {
        instance.commonClicked = true;
    },
    'click .tree-leaf input'(event, instance) {
        const $label = $(event.currentTarget).closest('label');
        const $container = $label.closest('.select-tree-root').find('.tree-options:first');
        if (instance.commonClicked) {
            const labelTop = $label.position().top;
            const containerCenter = Math.round($container.height() / 2);
            const labelCenter = Math.round($label.height() / 2);
            $container.scrollTop(labelTop - containerCenter + labelCenter);
        }
    }
});
