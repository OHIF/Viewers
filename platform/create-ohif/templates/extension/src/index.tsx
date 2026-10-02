import { id } from './id';
import './styles.css';

// <ohif-module:viewport>
import getViewportModule from './getViewportModule';
// </ohif-module:viewport>
// <ohif-module:panel>
import getPanelModule from './getPanelModule';
// </ohif-module:panel>
// <ohif-module:commands>
import getCommandsModule from './commandsModule';
// </ohif-module:commands>
// <ohif-module:sopClassHandler>
import getSopClassHandlerModule from './getSopClassHandlerModule';
// </ohif-module:sopClassHandler>
// <ohif-module:toolbar>
import getToolbarModule from './getToolbarModule';
// </ohif-module:toolbar>
// <ohif-module:hangingProtocol>
import getHangingProtocolModule from './getHangingProtocolModule';
// </ohif-module:hangingProtocol>

/**
 * The extension object. The host registers it by `id` and calls each
 * `get*Module` getter during registration. Keep this the default export and
 * keep every import above eager (no React.lazy at the top level): the UMD
 * bundle is a single file and must evaluate headlessly under stubbed globals.
 */
export default {
  /**
   * Required. MUST equal package.json `name` (see src/id.ts).
   */
  id,

  /**
   * Optional lifecycle hook, awaited before any module getter runs. Register
   * custom services here, or read `configuration` supplied by the app config.
   */
  preRegistration({ servicesManager, commandsManager, configuration = {} }) {},

  // <ohif-module:viewport>
  /**
   * Viewport components a mode can place in the viewer grid.
   * Each entry registers as `{{name}}.viewportModule.<name>`.
   */
  getViewportModule,
  // </ohif-module:viewport>
  // <ohif-module:panel>
  /**
   * Side-panel components. Each entry registers as
   * `{{name}}.panelModule.<name>`.
   */
  getPanelModule,
  // </ohif-module:panel>
  // <ohif-module:commands>
  /**
   * Commands runnable via commandsManager.runCommand(...) or bound to hotkeys.
   */
  getCommandsModule,
  // </ohif-module:commands>
  // <ohif-module:sopClassHandler>
  /**
   * Claims series (by SOP Class UID) into display sets the viewer can show.
   */
  getSopClassHandlerModule,
  // </ohif-module:sopClassHandler>
  // <ohif-module:toolbar>
  /**
   * Toolbar evaluators (and custom toolbar button components).
   */
  getToolbarModule,
  // </ohif-module:toolbar>
  // <ohif-module:hangingProtocol>
  /**
   * Hanging protocols modes can select for layout.
   */
  getHangingProtocolModule,
  // </ohif-module:hangingProtocol>
};
