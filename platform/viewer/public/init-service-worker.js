// https://developers.google.com/web/tools/workbox/modules/workbox-window
// All major browsers that support service worker also support native JavaScript
// modules, so it's perfectly fine to serve this code to any browsers
// (older browsers will just ignore it)
//
import { Workbox } from 'https://storage.googleapis.com/workbox-cdn/releases/5.0.0-beta.1/workbox-window.prod.mjs';

var supportsServiceWorker = 'serviceWorker' in navigator;
var isNotLocalDevelopment =
  ['localhost', '127'].indexOf(location.hostname) === -1;

if (supportsServiceWorker && isNotLocalDevelopment) {
  const swFileLocation = (window.PUBLIC_URL || '/') + 'sw.js';
  const wb = new Workbox(swFileLocation);

  // Add an event listener to detect when the registered
  // service worker has installed but is waiting to activate.
  wb.addEventListener('waiting', event => {
    // customize the UI prompt accordingly.
    const isFirstTimeUpdatedServiceWorkerIsWaiting =
      event.wasWaitingBeforeRegister === false;
    console.log(
      'isFirstTimeUpdatedServiceWorkerIsWaiting',
      isFirstTimeUpdatedServiceWorkerIsWaiting
    );

    // Assumes your app has some sort of prompt UI element
    // that a user can either accept or reject.
    // const prompt = createUIPrompt({
    //  onAccept: async () => {
    // Assuming the user accepted the update, set up a listener
    // that will reload the page as soon as the previously waiting
    // service worker has taken control.
    wb.addEventListener('controlling', event => {
      window.location.reload();
    });

    // Send a message telling the service worker to skip waiting.
    // This will trigger the `controlling` event handler above.
    // Note: for this to work, you have to add a message
    // listener in your service worker. See below.
    wb.messageSW({ type: 'SKIP_WAITING' });
    // },

    // onReject: () => {
    //   prompt.dismiss();
    // },
    // });
  });

  wb.register();
}
