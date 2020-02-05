import Mousetrap from 'mousetrap';
import pausePlugin from './pausePlugin';
import recordPlugin from './recordPlugin';

Mousetrap.pause = pausePlugin;

// The Mousetrap plugin is initialized by itself once we import
// https://github.com/ccampbell/mousetrap/blob/master/plugins/record/mousetrap-record.js#L189-L201

// Adds: .record(callback)
// Adds: .handleKey()
recordPlugin(Mousetrap);

const { record: hotkeyRecord } = Mousetrap;
export { hotkeyRecord };

export default Mousetrap;
