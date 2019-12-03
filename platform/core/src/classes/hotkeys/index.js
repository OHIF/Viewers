// Only imported in environment w/ `window`
// So we need to mock these for tests
import Mousetrap from 'mousetrap';
import pausePlugin from 'mousetrap/plugins/pause/mousetrap-pause.js';
import recordPlugin from './recordPlugin';

// import pausePlugin from './pausePlugin.js';
// import recordPlugin from './recordPlugin.js';

// // // TODO: May need to bind these so Mousetrap = this in plugins;
// pausePlugin(Mousetrap);
// recordPlugin(Mousetrap);

// console.log(Mousetrap);
// console.log(Object.keys(Mousetrap));

Mousetrap.record = recordPlugin;

export default Mousetrap;
