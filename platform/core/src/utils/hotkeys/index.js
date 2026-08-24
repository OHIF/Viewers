import Mousetrap from 'mousetrap';
import pausePlugin from './pausePlugin';
import recordPlugin from './recordPlugin';
import allowNativeKeysPlugin from './allowNativeKeysPlugin';

recordPlugin(Mousetrap);
pausePlugin(Mousetrap);
// Registered after pausePlugin so its stopCallback wraps the pause check: while
// paused, still stop; otherwise stop only for keystrokes landing in a modal
// dialog or an `.ohif-text-select` region, where the browser's own keyboard
// behaviour should win.
allowNativeKeysPlugin(Mousetrap);

export default Mousetrap;
