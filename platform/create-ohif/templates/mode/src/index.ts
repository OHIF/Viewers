import { id } from './id';
import toolbarButtons from './toolbarButtons';

// Namespaced module ids resolved from this mode's extension dependencies.
// Format: <extensionId>.<moduleType>.<entryName>.
const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
};

const cs3d = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

/**
 * Every extension named here must be present in the host — bundled into the
 * viewer build or itself loaded as a runtime extension. The host validates
 * these before the mode becomes routable.
 */
const extensionDependencies = {
  '@ohif/extension-default': '^{{ohifVersion}}',
  '@ohif/extension-cornerstone': '^{{ohifVersion}}',
};

function modeFactory({ modeConfiguration }) {
  return {
    /**
     * Required. MUST equal package.json `name` (see src/id.ts).
     */
    id,
    routeName: '{{dirName}}',
    // Double-quoted so scaffold-time descriptions survive substitution intact.
    displayName: "{{description}}",

    /**
     * Runs when the mode route mounts: set up tool bindings and the toolbar.
     */
    onModeEnter: ({ servicesManager, extensionManager }) => {
      const { toolbarService, toolGroupService } = servicesManager.services;
      const utilityModule = extensionManager.getModuleEntry(
        '@ohif/extension-cornerstone.utilityModule.tools'
      );
      const { toolNames, Enums } = utilityModule.exports;

      toolGroupService.createToolGroupAndAddTools('default', {
        active: [
          {
            toolName: toolNames.WindowLevel,
            bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
          },
          {
            toolName: toolNames.Pan,
            bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
          },
          {
            toolName: toolNames.Zoom,
            bindings: [{ mouseButton: Enums.MouseBindings.Secondary }, { numTouchPoints: 2 }],
          },
          {
            toolName: toolNames.StackScroll,
            bindings: [{ mouseButton: Enums.MouseBindings.Wheel }, { numTouchPoints: 3 }],
          },
        ],
      });

      toolbarService.register(toolbarButtons);
      toolbarService.updateSection('primary', ['WindowLevel', 'Pan', 'Zoom']);
    },

    /**
     * Runs when the route unmounts: tear down everything onModeEnter created.
     */
    onModeExit: ({ servicesManager }) => {
      const { toolGroupService, uiDialogService, uiModalService } = servicesManager.services;
      uiDialogService.hideAll();
      uiModalService.hide();
      toolGroupService.destroy();
    },

    validationTags: {
      study: [],
      series: [],
    },

    /**
     * Decides whether this mode is offered for a study. Return
     * `{ valid: false, description }` to hide it (e.g. unsupported modalities).
     */
    isValidMode: ({ modalities }) => ({ valid: true, description: '' }),

    routes: [
      {
        path: '{{dirName}}',
        layoutTemplate: () => ({
          id: ohif.layout,
          props: {
            leftPanels: [ohif.thumbnailList],
            leftPanelResizable: true,
            rightPanels: [ohif.measurements],
            rightPanelResizable: true,
            viewports: [
              {
                namespace: cs3d.viewport,
                displaySetsToDisplay: [ohif.sopClassHandler],
              },
            ],
          },
        }),
      },
    ],
    extensions: extensionDependencies,
    hangingProtocol: 'default',
    sopClassHandlers: [ohif.sopClassHandler],
  };
}

/**
 * The mode object. The host registers it by `id` and calls `modeFactory`
 * when the route is entered. Keep this the default export: the UMD bundle
 * exposes it as window['{{name}}'].
 */
export default {
  id,
  modeFactory,
  extensionDependencies,
};
