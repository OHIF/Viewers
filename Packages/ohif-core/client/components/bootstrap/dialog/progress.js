import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';

Template.dialogProgress.onCreated(() => {
  const instance = Template.instance();

  Session.set('progressDialogState', {
    processed: 0,
    total: instance.data.total,
    message: instance.data.message
  });
})

Template.dialogProgress.onRendered(() => {
  const instance = Template.instance();
  const task = instance.data.task;
  const state = Session.get('progressDialogState');

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
      const state = Session.get('progressDialogState');
      state.processed = Math.max(0, processed);

      Session.set('progressDialogState', state);
    }, 100),

    setTotal: _.throttle(total => {
      const state = Session.get('progressDialogState');
      state.total = total;

      Session.set('progressDialogState', state);
    }, 100),

    setMessage: _.throttle(message => {
      const state = Session.get('progressDialogState');
      state.message = message;

      Session.set('progressDialogState', state);
    }, 100)
  }

  task.run(progressDialog);
});

Template.dialogProgress.helpers({
  progress() {
    const state = Session.get('progressDialogState');

    if (!state || !state.total) {
      return 0;
    }

    return Math.min(1, state.processed / state.total) * 100;
  },

  message() {
    const state = Session.get('progressDialogState');
  
    if (!state) {
      return;
    }

    return state.message;
  }
})