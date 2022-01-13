import getPanelModule from "./getPanelModule.js";
import commandsModule from "./commandsModule";

export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: "extension.template",
  getPanelModule,
  getCommandsModule({ servicesManager, commandsManager }) {
    return commandsModule({ servicesManager, commandsManager });
  },
};
