var isNotLocalDevelopment =
  ['localhost', '127'].indexOf(location.hostname) === -1;

window.isUpdateAvailable = new Promise(function(resolve, reject) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          // ~~ Update Found
          registration.onupdatefound = () => {
            var installingWorker = reg.installing;
            installingWorker.onstatechange = () => {
              var updateAvailable =
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller;
              if (updateAvailable) {
                resolve(true);
              } else {
                resolve(false);
              }
            };
          };
          //
          console.log('SW registered: ', registration);
          // https://developers.google.com/web/fundamentals/push-notifications/subscribing-a-user
          // registration.pushManager
          //   .subscribe({
          //     userVisibleOnly: true,
          //     applicationServerKey: urlBase64ToUint8Array(
          //       'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
          //     ),
          //   })
          //   .then(hi => console.log(hi))
          //   .catch(err => console.log(err));
        })
        .catch(registrationError => {
          console.warn('SW Error: ', registrationError);
        });
    });
  }
});

window.isUpdateAvailable.then(isAvailable => {
  console.warn('~~~~~~~~~~~~~~~ UPDATE AVAILABLE');
});
