import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.pipelineInformationModal.onCreated(function() {
    const instance = Template.instance();

    const equalsFunc = (_old, _new) => {
        let equals = _old === _new;

        if (!equals) {
            instance.previousState.push(instance.container);
        }

        return equals;
    };

    instance.container = {
        target: new ReactiveVar('pipeline', equalsFunc),
        mode: new ReactiveVar('list', equalsFunc),
        currentItem: new ReactiveVar(null, equalsFunc),
        currentFilterItem: new ReactiveVar(null, equalsFunc),
        $form: null,
        resetState: function() {
            instance.container = instance.previousState.pop();
            //instance.container.mode.set('list');
            //instance.container.currentItem.set(null);
        }
    };
    instance.previousState = [];
});

Template.pipelineInformationModal.events({
    'click .js-back'(event, instance) {
        instance.container.resetState();
    }
});
