import { CommandsManager, ExtensionManager } from '@ohif/core';
import styles from './utils/styles';
import callInputDialog from './utils/callInputDialog';

export default function getCommandsModule({
  servicesManager,
  commandsManager,
  extensionManager,
}: {
  servicesManager: AppTypes.ServicesManager;
  commandsManager: CommandsManager;
  extensionManager: ExtensionManager;
}) {
  const { viewportGridService, uiDialogService, microscopyService } = servicesManager.services;

  const actions = {
    // Measurement tool commands:
    deleteMeasurement: ({ uid }) => {
      if (uid) {
        const roiAnnotation = microscopyService.getAnnotation(uid);
        if (roiAnnotation) {
          microscopyService.removeAnnotation(roiAnnotation);
        }
      }
    },

    setLabel: ({ uid }) => {
      const roiAnnotation = microscopyService.getAnnotation(uid);

      callInputDialog({
        uiDialogService,
        defaultValue: '',
        callback: (value: string, action: string) => {
          switch (action) {
            case 'save': {
              roiAnnotation.setLabel(value);
              microscopyService.triggerRelabel(roiAnnotation);
            }
          }
        },
      });
    },

    setToolActive: ({ toolName, toolGroupId = 'MICROSCOPY' }) => {
      const dragPanOnMiddle = [
        'dragPan',
        {
          bindings: {
            mouseButtons: ['middle'],
          },
        },
      ];
      const dragZoomOnRight = [
        'dragZoom',
        {
          bindings: {
            mouseButtons: ['right'],
          },
        },
      ];
      if (
        ['line', 'box', 'circle', 'point', 'polygon', 'freehandpolygon', 'freehandline'].indexOf(
          toolName
        ) >= 0
      ) {
        // TODO: read from configuration
        const options = {
          geometryType: toolName,
          vertexEnabled: true,
          styleOptions: styles.default,
          bindings: {
            mouseButtons: ['left'],
          },
        } as any;
        if ('line' === toolName) {
          options.minPoints = 2;
          options.maxPoints = 2;
        } else if ('point' === toolName) {
          delete options.styleOptions;
          delete options.vertexEnabled;
        }

        microscopyService.activateInteractions([
          ['draw', options],
          dragPanOnMiddle,
          dragZoomOnRight,
        ]);
      } else if (toolName == 'dragPan') {
        microscopyService.activateInteractions([
          [
            'dragPan',
            {
              bindings: {
                mouseButtons: ['left', 'middle'],
              },
            },
          ],
          dragZoomOnRight,
        ]);
      } else {
        microscopyService.activateInteractions([
          [
            toolName,
            {
              bindings: {
                mouseButtons: ['left'],
              },
            },
          ],
          dragPanOnMiddle,
          dragZoomOnRight,
        ]);
      }
    },
    toggleOverlays: () => {
      // overlay
      const overlays = document.getElementsByClassName('microscopy-viewport-overlay');
      let onoff = false; // true if this will toggle on
      for (let i = 0; i < overlays.length; i++) {
        if (i === 0) {
          onoff = overlays.item(0).classList.contains('hidden');
        }
        overlays.item(i).classList.toggle('hidden');
      }

      // overview
      const { activeViewportId } = viewportGridService.getState();
      microscopyService.toggleOverviewMap(activeViewportId);
    },
    toggleAnnotations: () => {
      microscopyService.toggleROIsVisibility();
    },
  };

  const definitions = {
    deleteMeasurement: {
      commandFn: actions.deleteMeasurement,
    },
    setLabel: {
      commandFn: actions.setLabel,
    },
    setToolActive: {
      commandFn: actions.setToolActive,
    },
    toggleOverlays: {
      commandFn: actions.toggleOverlays,
    },
    toggleAnnotations: {
      commandFn: actions.toggleAnnotations,
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'MICROSCOPY',
  };
}
