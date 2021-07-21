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

export default Mousetrap;
