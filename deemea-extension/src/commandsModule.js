import { demonstrateMeasurementService, createMeasurement } from './utils/measurementUtils';
import { OHIFMessageType } from './utils/enums';
import toolbarButtonsValidated from '../../deemea-mode/src/toolbarButtonsValidated';
import toolbarButtonsValidated3d from '../../deemea-mode-3d/src/toolbarButtonsValidated3d';
import toolbarButtons from '../../deemea-mode/src/toolbarButtons';
import toolbarButtons3d from '../../deemea-mode-3d/src/toolbarButtons3d';

const commandsModule = ({ servicesManager }) => {
  const actions = {
    demonstrateMeasurementService: () => {
      const {
        measurementService,
        ViewportGridService,
        CornerstoneViewportService,
        toolbarService,
      } = servicesManager.services;

      if (!measurementService || !ViewportGridService || !CornerstoneViewportService) {
        console.error('Required services are not available');
        return;
      }

      CornerstoneViewportService.subscribe(
        CornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
        () => {
          window.parent.postMessage(
            {
              type: OHIFMessageType.IMAGE_READY,
            },
            '*'
          );
        }
      );

      window.addEventListener('message', event => {
        if (event.data.type === OHIFMessageType.IMAGE_STATUS) {
          if (event.data.message.status === 'Validated') {
            if (event.data.message.imageType === '2D') {
              toolbarService?.setButtons(toolbarButtonsValidated);
              toolbarService?.refreshToolbarState();
            } else {
              toolbarService?.setButtons(toolbarButtonsValidated3d);
              toolbarService?.refreshToolbarState();
            }
          } else {
            if (event.data.message.imageType === '2D') {
              toolbarService?.setButtons(toolbarButtons);
              toolbarService?.refreshToolbarState();
            } else {
              toolbarService?.setButtons(toolbarButtons3d);
              toolbarService?.refreshToolbarState();
            }
          }
        }
        if (event.data.type === OHIFMessageType.UPDATE_TOOLBAR) {
          const CalibrationLineButton = document.querySelector('[data-cy="CalibrationLine"]');
          const ResetButton = document.querySelector('[data-cy="ResetButton"]');
          if (CalibrationLineButton) {
            if (event?.data.message.calibration) {
              CalibrationLineButton.style.backgroundColor = 'orange';
              CalibrationLineButton.style.color = 'white !important';
            } else {
              CalibrationLineButton.style.backgroundColor = '';
              CalibrationLineButton.style.color = 'white !important';
            }
          }

          if (ResetButton) {
            if (event.data.message.reset) {
              ResetButton.style.backgroundColor = 'orange';
            } else {
              ResetButton.style.backgroundColor = '';
            }
          }
        }
        if (event.data.type === OHIFMessageType.SEND_MEASURE) {
          measurementService.clearMeasurements();
          const relatedPoints = event.data.message.measures;
          demonstrateMeasurementService(servicesManager, relatedPoints, event.data.message.status);
          const viewportId = ViewportGridService.getActiveViewportId();
          const viewport = CornerstoneViewportService.getCornerstoneViewport(viewportId);
          const imageId = viewport.getCurrentImageId();
          const imageMetadata = viewport.getImageData(imageId);

          const imageWidth = imageMetadata.dimensions[0];
          const imageHeight = imageMetadata.dimensions[1];

          window.parent.postMessage(
            {
              type: OHIFMessageType.IMAGE_SIZE,
              message: {
                width: imageWidth,
                height: imageHeight,
              },
            },
            '*'
          );
        }
      });
    },
    linkMeasurement: info => {
      window.parent.postMessage(
        {
          type: OHIFMessageType.LINK_MEASURE,
          message: {
            elementType: info.toolName,
            uid: info.uid,
          },
        },
        '*'
      );
    },
    createForms: () => {
      const { measurementService } = servicesManager.services;

      measurementService.subscribe(measurementService.EVENTS.MEASUREMENT_ADDED, async event => {
        if (event.measurement.points) {
          const normalizedPoints = await createMeasurement(
            servicesManager,
            event.measurement.points
          );
          window.parent.postMessage(
            {
              type: OHIFMessageType.CREATE_MEASURE,
              message: {
                points: normalizedPoints,
                elementType: event.measurement.toolName,
                uid: event.measurement.uid,
              },
            },
            '*'
          );
        }
      });

      let dataToSend = [];
      measurementService.subscribe(measurementService.EVENTS.MEASUREMENT_UPDATED, async event => {
        const normalizedPoints = await createMeasurement(servicesManager, event.measurement.points);
        const matchedPoints = [];
        if (event?.measurement?.label?.predicted) {
          event?.measurement?.label.pointsInfo.forEach((point, index) => {
            matchedPoints.push({
              ...point,
              x: normalizedPoints[index][0],
              y: normalizedPoints[index][1],
            });
          });
        } else {
          event.measurement.points.forEach((point, index) => {
            matchedPoints.push({
              x: normalizedPoints[index][0],
              y: normalizedPoints[index][1],
            });
          });
        }

        dataToSend = {
          points: matchedPoints,
          elementType: event.measurement.toolName,
          uid: event.measurement.uid,
          measurementId: event?.measurement?.label.measurementId,
          hide: event?.measurement?.label?.hide,
          imagingData: event?.measurement?.label?.imagingData,
        };

        if (normalizedPoints) {
          window.parent.postMessage(
            {
              type: OHIFMessageType.UPDATE_MEASURE,
              message: dataToSend,
            },
            '*'
          );
        }
      });
    },
    deleteMeasurement: ({ uid }) => {
      if (uid) {
        const { measurementService } = servicesManager.services;
        measurementService.remove(uid);

        window.parent.postMessage(
          {
            type: OHIFMessageType.DELETE_MEASURE,
            message: { uid },
          },
          '*'
        );
      }
    },
    resetPoints: () => {
      const { measurementService, uiDialogService } = servicesManager.services;
      window.parent.postMessage(
        {
          type: OHIFMessageType.RESET_POINTS,
        },
        '*'
      );
      uiDialogService.dismiss({ id: 'context-menu' });
      measurementService.clearMeasurements();
    },
  };

  return {
    definitions: {
      demonstrateMeasurementService: {
        commandFn: actions.demonstrateMeasurementService,
        storeContexts: ['viewports'],
        options: {},
      },
      createForms: {
        commandFn: actions.createForms,
      },
      linkMeasurement: {
        commandFn: actions.linkMeasurement,
      },
      deleteMeasurement: {
        commandFn: actions.deleteMeasurement,
      },
      resetPoints: {
        commandFn: actions.resetPoints,
      },
    },
    defaultContext: 'VIEWER',
  };
};

export default commandsModule;
