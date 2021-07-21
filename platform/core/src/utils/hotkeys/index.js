import Mousetrap from 'mousetrap';
import pausePlugin from './pausePlugin';
import recordPlugin from './recordPlugin';

Mousetrap.initialize = () => {
  if (!Mousetrap._initialized) {
    recordPlugin(Mousetrap);
    pausePlugin(Mousetrap);

    Mousetrap._initialized = true;
  }
};

// These are only here so that Jest mocks them properly before .initialize() is called
Mousetrap.handleKey = () =>
  console.debug('Mousetrap recordPlugin not yet initialized');
Mousetrap.startRecording = () =>
  console.debug('Mousetrap recordPlugin not yet initialized');
Mousetrap.stopRecording = () =>
  console.debug('Mousetrap recordPlugin not yet initialized');
Mousetrap.record = () =>
  console.debug('Mousetrap recordPlugin not yet initialized');

Mousetrap.stopCallback = () =>
  console.debug('Mousetrap pausePlugin not yet initialized');
Mousetrap.pause = () =>
  console.debug('Mousetrap pausePlugin not yet initialized');
Mousetrap.unpause = () =>
  console.debug('Mousetrap pausePlugin not yet initialized');

export default Mousetrap;
