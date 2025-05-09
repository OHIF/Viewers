import { Enums } from '@cornerstonejs/tools';
import { Icons, utils } from '@ohif/ui-next';
import { ViewportDataOverlayMenuWrapper } from './components/ViewportDataOverlaySettingMenu/ViewportDataOverlayMenuWrapper';
import { ViewportOrientationMenuWrapper } from './components/ViewportOrientationMenu/ViewportOrientationMenuWrapper';
import { WindowLevelActionMenuWrapper } from './components/WindowLevelActionMenu/WindowLevelActionMenuWrapper';
import StatusComponent from './components/StatusComponent/StatusComponent';
import NavigationComponent from './components/NavigationComponent/NavigationComponent';

const getDisabledState = (disabledText?: string) => ({
  disabled: true,
  disabledText: disabledText ?? 'Not available on the current viewport',
});

export default function getToolbarModule({ servicesManager }: withAppTypes) {
  const {
    toolGroupService,
    toolbarService,
    syncGroupService,
    cornerstoneViewportService,
    displaySetService,
    viewportGridService,
  } = servicesManager.services;

  return [
    // StatusComponent
    {
      name: 'ohif.statusComponent',
      defaultComponent: StatusComponent,
    },
    {
      name: 'evaluate.statusComponent',
      evaluate: ({ viewportId }) => {
        // We can't use useViewportDisplaySets hook here since we're in a non-React context,
        // but we'll follow the same pattern by getting only the display sets for this viewport
        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

        if (!displaySetUIDs?.length) {
          return {
            disabled: true,
          };
        }

        // Get the display sets that are specifically in this viewport
        const viewportDisplaySets = displaySetUIDs.map(uid =>
          displaySetService.getDisplaySetByUID(uid)
        );

        // Only show status for supported types like SR, SEG, RTSTRUCT
        const isSupportedType = viewportDisplaySets.some(
          displaySet =>
            displaySet?.Modality === 'SR' ||
            displaySet?.Modality === 'SEG' ||
            displaySet?.Modality === 'RTSTRUCT'
        );

        // Check if the measurement tracking extension is present
        const measurementTrackingModule = servicesManager._extensionManager?.getModuleEntry(
          '@ohif/extension-measurement-tracking.contextModule.TrackedMeasurementsContext'
        );

        // Never disable if we have measurement tracking active, even if we don't have a specific
        // supported display set (SR, SEG, RTSTRUCT) - allow the tracking status to be shown
        // we let the status component handle the display set check or
        if (measurementTrackingModule) {
          return {
            disabled: false,
          };
        }

        return {
          disabled: !isSupportedType,
        };
      },
    },
    // NavigationComponent
    {
      name: 'ohif.navigationComponent',
      defaultComponent: NavigationComponent,
    },
    {
      name: 'evaluate.navigationComponent',
      evaluate: ({ viewportId }) => {
        // Same logic as statusComponent - only show for SR, SEG, RTSTRUCT
        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

        if (!displaySetUIDs?.length) {
          return {
            disabled: true,
          };
        }

        // Get the display sets that are specifically in this viewport
        const viewportDisplaySets = displaySetUIDs.map(uid =>
          displaySetService.getDisplaySetByUID(uid)
        );

        // Only show navigation for supported types like SR, SEG, RTSTRUCT
        const isSupportedType = viewportDisplaySets.some(
          displaySet =>
            displaySet?.Modality === 'SR' ||
            displaySet?.Modality === 'SEG' ||
            displaySet?.Modality === 'RTSTRUCT'
        );

        return {
          disabled: !isSupportedType,
        };
      },
    },
    {
      name: 'ohif.dataOverlayMenu',
      defaultComponent: ViewportDataOverlayMenuWrapper,
    },
    {
      name: 'evaluate.dataOverlayMenu',
      evaluate: ({ viewportId }) => {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        if (!viewport) {
          return {
            disabled: true,
          };
        }

        // Example: Show data overlay menu only for certain modalities
        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
        if (!displaySetUIDs?.length) {
          return {
            disabled: true,
          };
        }

        return {
          disabled: false,
        };
      },
    },
    {
      name: 'ohif.orientationMenu',
      defaultComponent: ViewportOrientationMenuWrapper,
    },
    {
      name: 'evaluate.orientationMenu',
      evaluate: ({ viewportId }) => {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        if (!viewport) {
          return {
            disabled: true,
          };
        }

        // Only show orientation menu for 3D capable viewports
        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
        const displaySets = displaySetUIDs.map(displaySetService.getDisplaySetByUID);
        const isNotReconstructable = displaySets.some(displaySet => !displaySet?.isReconstructable);

        const disabled = isNotReconstructable;

        return {
          disabled,
        };
      },
    },
    {
      name: 'ohif.windowLevelMenu',
      defaultComponent: WindowLevelActionMenuWrapper,
    },
    {
      name: 'evaluate.windowLevelMenu',
      evaluate: ({ viewportId }) => {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        if (!viewport) {
          return {
            disabled: true,
          };
        }

        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);
        const displaySets = displaySetUIDs.map(displaySetService.getDisplaySetByUID);

        const supportWindowLevel = displaySets.some(displaySet => displaySet?.supportsWindowLevel);

        return {
          disabled: !supportWindowLevel,
        };
      },
    },
    // functions/helpers to be used by the toolbar buttons to decide if they should
    // enabled or not
    {
      name: 'evaluate.viewport.supported',
      evaluate: ({ viewportId, unsupportedViewportTypes, disabledText }) => {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        if (viewport && unsupportedViewportTypes?.includes(viewport.type)) {
          return getDisabledState(disabledText);
        }

        return undefined;
      },
    },
    {
      name: 'evaluate.modality.supported',
      evaluate: ({ viewportId, unsupportedModalities, supportedModalities, disabledText }) => {
        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

        if (!displaySetUIDs?.length) {
          return;
        }

        const displaySets = displaySetUIDs.map(displaySetService.getDisplaySetByUID);

        // Check for unsupported modalities (exclusion)
        if (unsupportedModalities?.length) {
          const hasUnsupportedModality = displaySets.some(displaySet =>
            unsupportedModalities.includes(displaySet?.Modality)
          );

          if (hasUnsupportedModality) {
            return getDisabledState(disabledText);
          }
        }

        // Check for supported modalities (inclusion)
        if (supportedModalities?.length) {
          const hasAnySupportedModality = displaySets.some(displaySet =>
            supportedModalities.includes(displaySet?.Modality)
          );

          if (!hasAnySupportedModality) {
            return getDisabledState(disabledText || 'Tool not available for this modality');
          }
        }
      },
    },
    {
      name: 'evaluate.cornerstoneTool',
      evaluate: ({ viewportId, button, toolNames, disabledText }) => {
        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

        if (!toolGroup) {
          return;
        }

        const toolName = toolbarService.getToolNameForButton(button);

        if (!toolGroup || (!toolGroup.hasTool(toolName) && !toolNames)) {
          return getDisabledState(disabledText);
        }

        const isPrimaryActive = toolNames
          ? toolNames.includes(toolGroup.getActivePrimaryMouseButtonTool())
          : toolGroup.getActivePrimaryMouseButtonTool() === toolName;

        return {
          disabled: false,
          isActive: isPrimaryActive,
        };
      },
    },
    {
      name: 'evaluate.action',
      evaluate: () => {
        return {
          disabled: false,
        };
      },
    },
    {
      name: 'evaluate.cornerstoneTool.toggle.ifStrictlyDisabled',
      evaluate: ({ viewportId, button, disabledText }) =>
        _evaluateToggle({
          viewportId,
          button,
          toolbarService,
          disabledText,
          offModes: [Enums.ToolModes.Disabled],
          toolGroupService,
        }),
    },
    {
      name: 'evaluate.cornerstoneTool.toggle',
      evaluate: ({ viewportId, button, disabledText }) =>
        _evaluateToggle({
          viewportId,
          button,
          toolbarService,
          disabledText,
          offModes: [Enums.ToolModes.Disabled, Enums.ToolModes.Passive],
          toolGroupService,
        }),
    },
    {
      name: 'evaluate.cornerstone.synchronizer',
      evaluate: ({ viewportId, button }) => {
        let synchronizers = syncGroupService.getSynchronizersForViewport(viewportId);

        if (!synchronizers?.length) {
          return {
            className: utils.getToggledClassName(false),
          };
        }

        const isArray = Array.isArray(button.commands);

        const synchronizerType = isArray
          ? button.commands?.[0].commandOptions.type
          : button.commands?.commandOptions.type;

        synchronizers = syncGroupService.getSynchronizersOfType(synchronizerType);

        if (!synchronizers?.length) {
          return {
            className: utils.getToggledClassName(false),
          };
        }

        // Todo: we need a better way to find the synchronizers based on their
        // type, but for now we just check the first one and see if it is
        // enabled
        const synchronizer = synchronizers[0];

        const isEnabled = synchronizer?._enabled;

        return {
          className: utils.getToggledClassName(isEnabled),
        };
      },
    },
    {
      name: 'evaluate.viewportProperties.toggle',
      evaluate: ({ viewportId, button }) => {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        if (!viewport || viewport.isDisabled) {
          return;
        }

        const propId = button.id;

        const properties = viewport.getProperties();
        const camera = viewport.getCamera();

        const prop = camera?.[propId] || properties?.[propId];

        if (!prop) {
          return {
            disabled: false,
          };
        }

        const isToggled = prop;

        return {
          className: utils.getToggledClassName(isToggled),
        };
      },
    },
    {
      name: 'evaluate.displaySetIsReconstructable',
      evaluate: ({ viewportId, disabledText = 'Selected viewport is not reconstructable' }) => {
        const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId);

        if (!viewport) {
          return;
        }

        const displaySetUIDs = viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

        const displaySets = displaySetUIDs.map(displaySetService.getDisplaySetByUID);

        const areReconstructable = displaySets.every(displaySet => {
          return displaySet?.isReconstructable;
        });

        if (!areReconstructable) {
          return getDisabledState(disabledText);
        }

        return {
          disabled: false,
        };
      },
    },
  ];
}

function _evaluateToggle({
  viewportId,
  toolbarService,
  button,
  disabledText,
  offModes,
  toolGroupService,
}) {
  const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);

  if (!toolGroup) {
    return;
  }
  const toolName = toolbarService.getToolNameForButton(button);

  if (!toolGroup?.hasTool(toolName)) {
    return getDisabledState(disabledText);
  }

  const isOff = offModes.includes(toolGroup.getToolOptions(toolName).mode);

  return {
    className: utils.getToggledClassName(!isOff),
  };
}
