import log from '../log.js';

export default function handleError(error) {
  let { title, message } = error;

  if (!title) {
    if (error instanceof Error) {
      title = error.name;
    }
  }

  if (!message) {
    if (error instanceof Error) {
      message = error.message;
    }
  }

  const data = Object.assign(
    {
      title,
      message,
      class: 'themed',
      hideConfirm: true,
      cancelLabel: 'Dismiss',
      cancelClass: 'btn-secondary',
    },
    error || {}
  );

  log.error(error);
  // TODO: Find a better way to handle errors instead of displaying a dialog for all of them.
  // OHIF.ui.showDialog('dialogForm', data);
}
