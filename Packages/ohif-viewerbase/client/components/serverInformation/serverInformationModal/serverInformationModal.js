import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.serverInformationModal.onCreated(function() {
    const instance = Template.instance();
    instance.container = {
        mode: new ReactiveVar('list'),
        serverType: new ReactiveVar(null),
        currentItem: new ReactiveVar(null),
        $form: null,
        resetState: function() {
            instance.container.mode.set('list');
            instance.container.serverType.set(null);
            instance.container.currentItem.set(null);
        }
    };
});

Template.serverInformationModal.events({
    'click .js-back'(event, instance) {
        instance.container.resetState();
    }
});
