import toolbarButtons from "./toolbarButtons.js";
import { hotkeys } from "@ohif/core";

const ohif = {
  layout: "org.ohif.default.layoutTemplateModule.viewerLayout",
  sopClassHandler: "org.ohif.default.sopClassHandlerModule.stack",
  hangingProtocols: "org.ohif.default.hangingProtocolModule.default",
  viewport: "org.ohif.cornerstone.viewportModule.cornerstone",
};

const clock = {
  panel: "extension.template.panelModule.clockPanel",
};

export default function mode({ modeConfiguration }) {
  return {
    id: "template",
    displayName: "Template Mode",
    /**
     * Lifecycle hooks
     */
    onModeEnter: ({ servicesManager, extensionManager }) => {
      const { ToolBarService } = servicesManager.services;
      ToolBarService.init(extensionManager);
      ToolBarService.addButtons(toolbarButtons);
      ToolBarService.createButtonSection("primary", ["Time"]);
    },
    onModeExit: () => {},
    validationTags: {
      study: [],
      series: [],
    },
    isValidMode: ({ modalities }) => {
      const modalities_list = modalities.split("\\");

      // Slide Microscopy modality not supported by basic mode yet
      return !modalities_list.includes("SM");
    },
    routes: [
      {
        path: "template",
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [],
              rightPanels: [clock.panel],
              viewports: [
                {
                  namespace: ohif.viewport,
                  displaySetsToDisplay: [ohif.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    extensions: [
      "extension.template",
      "org.ohif.default",
      "org.ohif.cornerstone",
    ],
    hangingProtocols: [ohif.hangingProtocols],
    sopClassHandlers: [ohif.sopClassHandler],
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
  };
}

window.templateMode = mode({});
