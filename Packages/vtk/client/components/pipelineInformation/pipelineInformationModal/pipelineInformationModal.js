import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.pipelineInformationModal.onCreated(function() {
    const instance = Template.instance();
    instance.container = {
        mode: new ReactiveVar('list'),
        currentItem: new ReactiveVar(null),
        $form: null,
        resetState: function() {
            instance.container.mode.set('list');
            instance.container.currentItem.set(null);
        }
    };
});

Template.pipelineInformationModal.events({
    'click .js-back'(event, instance) {
        instance.container.resetState();
    }
});
