function MultiMonitor() {
  const { href } = window.location;
  console.log('multiMonitor', href);

  const screenDetailsPromise = window.getScreenDetails?.();
  if (screenDetailsPromise) {
    screenDetailsPromise.then(screenDetails => {
      const { screens } = screenDetails;
      const baseURL = href.replace('/multimonitor', '/basic-test');
      console.log('Hello multi-monitor', ...screens);
      const newScreen = screens.find(screen => screen.isPrimary === true);
      const width = Math.floor(newScreen.availWidth / 2) - 2;
      const height = newScreen.availHeight;
      const window1 = window.open(
        `${baseURL}&hangingProtocolId=@ohif/hpMultiMonitor2&screen=0-0.5`,
        'ohifScreen1',
        `screenX=${width + 1},top=0,width=${width},height=${height}`
      );
      console.log('Opened', window1);
      window.window1 = window1;
      window.moveTo(0, 0);
    });
  } else {
    console.log('Not multi monitor', screenDetailsPromise);
  }
}

export default MultiMonitor;
