import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';

Template.dialogProgress.onCreated(() => {
    const instance = Template.instance();

    instance.state = new ReactiveVar({
        processed: 0,
        total: instance.data.total,
        message: instance.data.message
    });
});

Template.dialogProgress.onRendered(() => {
    const instance = Template.instance();
    const task = instance.data.task;

    const progressDialog = {
        promise: instance.data.promise,

        done: value => {
            // Hide the modal, removing the backdrop
            instance.$('.modal').on('hidden.bs.modal', event => {
                instance.data.promiseResolve(value);
            }).modal('hide');
        },

        cancel: () => {
            // Hide the modal, removing the backdrop
            instance.$('.modal').on('hidden.bs.modal', event => {
                instance.data.promiseReject();
            }).modal('hide');
        },

        update: _.throttle(processed => {
            const state = instance.state.get();
            state.processed = Math.max(0, processed);

            instance.state.set(state);
        }, 100),

        setTotal: _.throttle(total => {
            const state = instance.state.get();
            state.total = total;

            instance.state.set(state);
        }, 100),

        setMessage: _.throttle(message => {
            const state = instance.state.get();
            state.message = message;

            instance.state.set(state);
        }, 100)
    };

    task.run(progressDialog);
});

Template.dialogProgress.helpers({
    progress() {
        const instance = Template.instance();
        const state = instance.state.get();

        if (!state || !state.total) {
            return 0;
        }

        return Math.min(1, state.processed / state.total) * 100;
    },

    message() {
        const instance = Template.instance();
        const state = instance.state.get();

        if (!state) {
            return;
        }

        if (typeof state.message === 'function') {
            return state.message(state);
        }

        return state.message;
    }
});
