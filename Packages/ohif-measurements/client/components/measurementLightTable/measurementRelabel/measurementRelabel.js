import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { $ } from 'meteor/jquery';
import { 
    segmentedTerminologyList,
    segmentedTerminologyCommonList } from '../../../lib/getLabelTerminologyList';

Template.measurementRelabel.onCreated(() => {
    const instance = Template.instance();

    instance.value = instance.data.currentValue || '';

    instance.state = new ReactiveVar('closed');

    instance.items = segmentedTerminologyList;
    instance.commonItems = segmentedTerminologyCommonList;
});

Template.measurementRelabel.onRendered(() => {
    const instance = Template.instance();
    const $measurementRelabel = instance.$('.measurement-relabel');

    // Make the measure flow bounded by the window borders
    $measurementRelabel.bounded();

    // Wait template rerender before rendering the selectTree
    Tracker.afterFlush(() => {
        // Get the click  or rendering position
        const position = {
            left: event.clientX || instance.data.position.x,
            top: event.clientY || instance.data.position.y,
        };

        // Define the data for selectTreeComponent
        const data = {
            key: 'label',
            items: instance.items,
            commonItems: instance.commonItems,
            hideCommon: instance.data.hideCommon,
            label: 'Assign label',
            search: true,
            searchPlaceholder: 'Search labels',
            threeColumns: instance.data.threeColumns,
            position
        };

        // Define in which element the selectTree will be rendered in
        const parentElement = $measurementRelabel[0];

        // Render the selectTree element
        instance.selectTreeView = Blaze.renderWithData(Template.selectTree, data, parentElement);

        // Focus the measure flow to handle closing
        $measurementRelabel.focus();
    });
});

Template.measurementRelabel.events({
    'click, mousedown, mouseup'(event, instance) {
        event.stopPropagation();
    },

    'click .tree-leaf input'(event, instance) {
        const $target = $(event.currentTarget);
        const $measureFlow = instance.$('.measurement-relabel');
        instance.state.set('selected');

        instance.value = $target.data('component').value();
        instance.data.updateCallback(instance.value);

        $measureFlow.trigger('close')
    },

    'blur .measurement-relabel'(event, instance) {
        const $measurementRelabel = $(event.currentTarget);
        const element = $measurementRelabel[0];
        Meteor.defer(() => {
            const focused = $(':focus')[0];
            if (element !== focused && !$.contains(element, focused)) {
                $measurementRelabel.trigger('close');
            }
        });
    },

    'mouseleave .measurement-relabel'(event, instance) {
        const $measurementRelabel = $(event.currentTarget);
        const canClose = instance.state.get() === 'selected';
        if (canClose && !$.contains($measurementRelabel[0], event.toElement)) {
            $measurementRelabel.trigger('close');
        }
    },

    'mouseenter .measurement-relabel'(event, instance) {
        // Prevent from closing if user go out and in too fast
        clearTimeout(instance.closingTimeout);
        $(event.currentTarget).off('animationend').removeClass('fadeOut');
    },

    'close .measurement-relabel'(event, instance) {
        // Clear the timeout to prevent executing the close process twice
        clearTimeout(instance.closingTimeout);
        instance.data.doneCallback();
    }
});
