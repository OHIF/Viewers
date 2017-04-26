import { OHIF } from 'meteor/ohif:core';
import { HotkeysManager } from 'meteor/ohif:hotkeys/client/classes/HotkeysManager';
import 'jquery.hotkeys';

// Create hotkeys namespace using a HotkeysManager class instance
const hotkeys = new HotkeysManager();

// Append hotkeys namespace to OHIF namespace
OHIF.hotkeys = hotkeys;

// Export relevant objects
export { hotkeys };
