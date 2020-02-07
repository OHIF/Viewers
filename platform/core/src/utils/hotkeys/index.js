import Mousetrap from 'mousetrap';
import pausePlugin from './pausePlugin';
import recordPlugin from './recordPlugin';

recordPlugin(Mousetrap);
pausePlugin(Mousetrap);

export default Mousetrap;
