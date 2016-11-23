import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { _ } from 'meteor/underscore';

Template.dialogProgress.onCreated(() => {
  console.log('dialogProgress :: onCreated');
});

Template.dialogProgress.onCreated(() => {
  Session.set('progressDialogState', {
    progress: 0,
    message: 'Test Message'
  });
})

Template.dialogProgress.onDestroyed(() => {
  Session.set('progressDialogState', undefined);
})

Template.dialogProgress.onRendered(() => {
  const instance = Template.instance();
  const task = instance.data.task;
  const state = Session.get('progressDialogState');

  const progressDialog = {
    promise: instance.data.promise,

    done: () => {
      // Hide the modal, removing the backdrop
      instance.$('.modal').on('hidden.bs.modal', event => {
        instance.data.promiseResolve();
      }).modal('hide');
    },

    cancel: () => {
      // Hide the modal, removing the backdrop
      instance.$('.modal').on('hidden.bs.modal', event => {
        instance.data.promiseReject();
      }).modal('hide');
    },

    setProgress: _.throttle(progress => {
      const state = Session.get('progressDialogState');
      state.progress = Math.min(1, progress);

      Session.set('progressDialogState', state);
    }, 100),

    setMessage: _.throttle(message => {
      const state = Session.get('progressDialogState');
      state.message = message;

      Session.set('progressDialogState', state);
    }, 100)
  }

  task.start(progressDialog);
});

Template.dialogProgress.helpers({
  progress() {
    const state = Session.get('progressDialogState');
    if (!state) {
      return;
    }

    return state.progress * 100;
  },

  message() {
    const state = Session.get('progressDialogState');
    if (!state) {
      return;
    }

    return state.message;
  }
})