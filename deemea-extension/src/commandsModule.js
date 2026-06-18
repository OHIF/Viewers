import { demonstrateMeasurementService, createMeasurement } from './utils/measurementUtils';
import { OHIFMessageType } from './utils/enums';
import toolbarButtonsValidated from '../../deemea-mode/src/toolbarButtonsValidated';
import toolbarButtonsValidated3d from '../../deemea-mode-3d/src/toolbarButtonsValidated3d';
import toolbarButtons from '../../deemea-mode/src/toolbarButtons';
import toolbarButtons3d from '../../deemea-mode-3d/src/toolbarButtons3d';
import segmentationButtonsValidated from '../../deemea-mode-3d/src/segmentationButtonsValidated';
import segmentationButtons from '../../deemea-mode-3d/src/segmentationButtons';
import { CustomizationScope } from '@ohif/core/src/services/CustomizationService/CustomizationService';
import * as cs3dTools from '@cornerstonejs/tools';

const commandsModule = ({ servicesManager, commandsManager }) => {
  let segmentationLoaded = false;
  const actions = {
    demonstrateMeasurementService: () => {
      const {
        measurementService,
        ViewportGridService,
        CornerstoneViewportService,
        SegmentationService,
        toolbarService,
        displaySetService,
        customizationService,
      } = servicesManager.services;

      if (
        !measurementService ||
        !ViewportGridService ||
        !CornerstoneViewportService ||
        !SegmentationService ||
        !displaySetService ||
        !customizationService
      ) {
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
          if (segmentationLoaded) {
            return;
          }

          const displaySets = displaySetService.getActiveDisplaySets();
          if (displaySets.length) {
            const segmentationDisplaySet = displaySets.filter(
              display => display.Modality === 'SEG'
            );

            if (segmentationDisplaySet.length === 1) {
              customizationService.setCustomizations([
                {
                  'panelSegmentation.disableAddSegmentation': {
                    $set: true,
                  },
                },
              ]);
              const currentViewport = ViewportGridService.getState().viewports['default'];

              const currentDisplaySetUID = currentViewport?.displaySetInstanceUIDs?.[0];

              if (currentDisplaySetUID !== segmentationDisplaySet[0].displaySetInstanceUID) {
                const checkSegmentationReady = (retryCount = 0, maxRetries = 50) => {
                  const displaySet = displaySetService.getDisplaySetByUID(
                    segmentationDisplaySet[0].displaySetInstanceUID
                  );

                  if (displaySet?.isLoaded || displaySet?.instances?.length > 0) {
                    segmentationLoaded = true;
                    const updatedViewports = [
                      {
                        viewportId: 'default',
                        displaySetInstanceUIDs: [segmentationDisplaySet[0].displaySetInstanceUID],
                      },
                    ];
                    ViewportGridService.setDisplaySetsForViewports(updatedViewports);
                  } else if (retryCount < maxRetries) {
                    setTimeout(() => checkSegmentationReady(retryCount + 1, maxRetries), 100);
                  } else {
                    console.warn('Segmentation loading timed out after', maxRetries * 100, 'ms');
                  }
                };
                checkSegmentationReady();
              }
            }
          }
        }
      );

      window.addEventListener('message', event => {
        if (event.data.type === OHIFMessageType.IMAGE_STATUS) {
          if (event.data.message.status === 'Validated') {
            if (event.data.message.imageType === '2D') {
              const style = document.createElement('style');
              style.textContent = `#svg-layer-default circle {
                stroke-width: 4px !important;
                r: 2px !important;
              }`;
              document.head.appendChild(style);
              toolbarService?.setButtons(toolbarButtonsValidated);
              toolbarService?.refreshToolbarState();
            } else {
              toolbarService?.setButtons(toolbarButtonsValidated3d);
              toolbarService?.refreshToolbarState();
              toolbarService?.addButtons(segmentationButtonsValidated, true);
              customizationService.setCustomizations(
                [
                  {
                    'panelSegmentation.disableEditing': {
                      $set: true,
                    },
                    'panelSegmentation.showAddSegment': {
                      $set: false,
                    },
                  },
                ],
                CustomizationScope.Global
              );
            }
          } else {
            if (event.data.message.imageType === '2D') {
              const style = document.createElement('style');
              style.textContent = `#svg-layer-default circle {
              stroke-width: 4px !important;
              r: 2px !important;
              }`;
              document.head.appendChild(style);
              toolbarService?.setButtons(toolbarButtons);
              toolbarService?.refreshToolbarState();
            } else {
              toolbarService?.setButtons(toolbarButtons3d);
              toolbarService?.refreshToolbarState();
              toolbarService?.addButtons(segmentationButtons, true);

              customizationService.setCustomizations(
                [
                  {
                    'panelSegmentation.disableEditing': {
                      $set: false,
                    },
                    'panelSegmentation.showAddSegment': {
                      $set: true,
                    },
                  },
                ],
                CustomizationScope.Global
              );
            }
          }
        }
        if (event.data.type === OHIFMessageType.UPDATE_TOOLBAR) {
          const CalibrationLineButton = document.querySelector('[aria-label="Calibration"]');
          const ResetButton = document.querySelector('[aria-label="Reset predictions"]');
          if (CalibrationLineButton) {
            if (event?.data.message.calibration) {
              CalibrationLineButton.style.backgroundColor = 'orange';
              // CalibrationLineButton.style.color = 'white !important';
            } else {
              CalibrationLineButton.style.backgroundColor = '';
              // CalibrationLineButton.style.color = 'white !important';
            }
          }

          if (event?.data?.message?.blockCalibration) {
            CalibrationLineButton.disabled = true;
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
          const viewportId = ViewportGridService.getActiveViewportId();
          const viewport = CornerstoneViewportService.getCornerstoneViewport(viewportId);
          if (!viewport?.getCurrentImageId?.()) {
            setTimeout(() => {
              // Re-dispatch the event
              window.dispatchEvent(new MessageEvent('message', { data: event.data }));
            }, 1000);
            return;
          }
          measurementService.clearMeasurements();
          const relatedPoints = event.data.message.measures;
          demonstrateMeasurementService(servicesManager, relatedPoints, event.data.message.status);
          const imageId = viewport.getCurrentImageId();
          const isVolumeViewport = viewport.type === 'volume' || viewport.getImageIds;
          const imageMetadata = isVolumeViewport
            ? viewport.getImageData() // Volume viewport - no argument
            : viewport.getImageData(imageId); // Stack viewport - needs imageId

          const imageWidth = imageMetadata.dimensions[0];
          const imageHeight = imageMetadata.dimensions[1];
          const pixelSpacing = imageMetadata.spacing[0];

          viewport.render();

          window.parent.postMessage(
            {
              type: OHIFMessageType.IMAGE_SIZE,
              message: {
                width: imageWidth,
                height: imageHeight,
                pixelSpacing,
              },
            },
            '*'
          );
        }

        if (event.data.type === OHIFMessageType.SAVE_SEGMENTATION_STATS) {
          const segmentation = SegmentationService.getSegmentations();

          const segments = segmentation[0].segments;

          const stats = {};
          Object.values(segments).forEach(segment => {
            stats[segment.label] = [];
            Object.values(segment?.cachedStats?.namedStats).forEach(stat => {
              stats[segment.label].push({
                label: stat.label,
                value: stat.value,
                unit: stat.unit,
              });
            });
          });

          if (stats && Object.entries(stats).length) {
            window.parent.postMessage(
              {
                type: OHIFMessageType.SEND_SEGMENTATION_STATS,
                message: {
                  stats,
                },
              },
              '*'
            );
          }
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
              sliceIndex: normalizedPoints[index][2],
            });
          });
        } else {
          event.measurement.points.forEach((point, index) => {
            matchedPoints.push({
              x: normalizedPoints[index][0],
              y: normalizedPoints[index][1],
              sliceIndex: normalizedPoints[index][2],
            });
          });
        }

        dataToSend = {
          points: matchedPoints,
          elementType: event.measurement.toolName,
          uid: event.measurement.uid,
          measurementId: event?.measurement?.label?.measurementId || '',
          hide: event?.measurement?.label?.hide || false,
          forceHide: event?.measurement?.label?.forceHide || false,
          locked: event?.measurement?.label?.locked || false,
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
        const measurement = measurementService.getMeasurement(uid);
        const measurementId = measurement.label.measurementId;
        measurementService.remove(uid);

        window.parent.postMessage(
          {
            type: OHIFMessageType.DELETE_MEASURE,
            message: { uid, measurementId },
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
      uiDialogService.hide('context-menu');
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
