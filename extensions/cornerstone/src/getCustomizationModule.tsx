import React from 'react';
import { Enums } from '@cornerstonejs/tools';
import { toolNames } from './initCornerstoneTools';
import defaultWindowLevelPresets from './components/WindowLevelActionMenu/defaultWindowLevelPresets';
import { colormaps } from './utils/colormaps';
import { CONSTANTS } from '@cornerstonejs/core';
import DicomUpload from './components/DicomUpload/DicomUpload';
import { CinePlayer } from '@ohif/ui';
import {
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  Icons,
  DropdownMenuSubTrigger,
} from '@ohif/ui-next';

const DefaultColormap = 'Grayscale';
const { VIEWPORT_PRESETS } = CONSTANTS;

function getCustomizationModule({ commandsManager, servicesManager }) {
  return [
    {
      name: 'default',
      value: {
        cinePlayer: CinePlayer,
        cornerstoneViewportClickCommands: {
          doubleClick: ['toggleOneUp'],
          button1: ['closeContextMenu'],
          button3: [
            {
              commandName: 'showCornerstoneContextMenu',
              commandOptions: {
                requireNearbyToolData: true,
                menuId: 'measurementsContextMenu',
              },
            },
          ],
        },
        'PanelSegmentation.CustomDropdownMenuContent': ({
          activeSegmentation,
          onSegmentationAdd,
          onSegmentationRemoveFromViewport,
          onSegmentationEdit,
          onSegmentationDelete,
          allowExport,
          storeSegmentation,
          onSegmentationDownload,
          onSegmentationDownloadRTSS,
          t,
        }) => (
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onSegmentationAdd(activeSegmentation.segmentationId)}>
              <Icons.Add className="text-foreground" />
              <span className="pl-2">{t('Create New Segmentation')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t('Manage Current Segmentation')}</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onSegmentationRemoveFromViewport(activeSegmentation.segmentationId)}
            >
              <Icons.Series className="text-foreground" />
              <span className="pl-2">{t('Remove from Viewport')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSegmentationEdit(activeSegmentation.segmentationId)}>
              <Icons.Rename className="text-foreground" />
              <span className="pl-2">{t('Rename')}</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                disabled={!allowExport}
                className="pl-1"
              >
                <Icons.Export className="text-foreground" />
                <span className="pl-2">{t('Export & Download')}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => storeSegmentation(activeSegmentation.segmentationId)}
                  >
                    {t('Export DICOM SEG')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSegmentationDownload(activeSegmentation.segmentationId)}
                  >
                    {t('Download DICOM SEG')}
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem
                        onClick={() => onSegmentationDownloadRTSS(activeSegmentation.segmentationId)}
                      >
                        {t('Download DICOM RTSTRUCT')}
                      </DropdownMenuItem> */}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onSegmentationDelete(activeSegmentation.segmentationId)}
            >
              <Icons.Delete className="text-red-600" />
              <span className="pl-2 text-red-600">{t('Delete')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        ),
        autoCineModalities: ['OT', 'US'],
        'PanelSegmentation.disableEditing': false,
        'PanelSegmentation.showAddSegment': true,
        'PanelSegmentation.onSegmentationAdd': () => {
          const { viewportGridService } = servicesManager.services;
          const viewportId = viewportGridService.getState().activeViewportId;
          commandsManager.run('createLabelmapForViewport', { viewportId });
        },
        'PanelSegmentation.tableMode': 'collapsed',
        'PanelSegmentation.readableText': {
          lesionStats: 'Lesion Statistics',
          minValue: 'Minimum Value',
          maxValue: 'Maximum Value',
          meanValue: 'Mean Value',
          volume: 'Volume (ml)',
          suvPeak: 'SUV Peak',
          suvMax: 'Maximum SUV',
          suvMaxIJK: 'SUV Max IJK',
          lesionGlyoclysisStats: 'Lesion Glycolysis',
        },
        codingValues: {},
        'PanelMeasurement.disableEditing': false,
        onBeforeSRAddMeasurement: ({ measurement, StudyInstanceUID, SeriesInstanceUID }) => {
          return measurement;
        },
        onBeforeDicomStore: ({ dicomDict, measurementData, naturalizedReport }) => {
          return dicomDict;
        },
        dicomUploadComponent: DicomUpload,
        'viewportOverlay.topLeft': [
          {
            id: 'StudyDate',
            inheritsFrom: 'ohif.overlayItem',
            label: '',
            title: 'Study date',
            condition: ({ referenceInstance }) => referenceInstance?.StudyDate,
            contentF: ({ referenceInstance, formatters: { formatDate } }) =>
              formatDate(referenceInstance.StudyDate),
          },
          {
            id: 'SeriesDescription',
            inheritsFrom: 'ohif.overlayItem',
            label: '',
            title: 'Series description',
            condition: ({ referenceInstance }) => {
              return referenceInstance && referenceInstance.SeriesDescription;
            },
            contentF: ({ referenceInstance }) => referenceInstance.SeriesDescription,
          },
        ],
        'viewportOverlay.topRight': [],
        'viewportOverlay.bottomLeft': [
          {
            id: 'WindowLevel',
            inheritsFrom: 'ohif.overlayItem.windowLevel',
          },
          {
            id: 'ZoomLevel',
            inheritsFrom: 'ohif.overlayItem.zoomLevel',
            condition: props => {
              const activeToolName = props.toolGroupService.getActiveToolForViewport(
                props.viewportId
              );
              return activeToolName === 'Zoom';
            },
          },
        ],
        'viewportOverlay.bottomRight': [
          {
            id: 'InstanceNumber',
            inheritsFrom: 'ohif.overlayItem.instanceNumber',
          },
        ],
        'layoutSelector.advancedPresetGenerator': ({ servicesManager }) => {
          const _areSelectorsValid = (hp, displaySets, hangingProtocolService) => {
            if (!hp.displaySetSelectors || Object.values(hp.displaySetSelectors).length === 0) {
              return true;
            }

            return hangingProtocolService.areRequiredSelectorsValid(
              Object.values(hp.displaySetSelectors),
              displaySets[0]
            );
          };

          const generateAdvancedPresets = ({ servicesManager }: withAppTypes) => {
            const { hangingProtocolService, viewportGridService, displaySetService } =
              servicesManager.services;

            const hangingProtocols = Array.from(hangingProtocolService.protocols.values());

            const viewportId = viewportGridService.getActiveViewportId();

            if (!viewportId) {
              return [];
            }
            const displaySetInsaneUIDs =
              viewportGridService.getDisplaySetsUIDsForViewport(viewportId);

            if (!displaySetInsaneUIDs) {
              return [];
            }

            const displaySets = displaySetInsaneUIDs.map(uid =>
              displaySetService.getDisplaySetByUID(uid)
            );

            return hangingProtocols
              .map(hp => {
                if (!hp.isPreset) {
                  return null;
                }

                const areValid = _areSelectorsValid(hp, displaySets, hangingProtocolService);

                return {
                  icon: hp.icon,
                  title: hp.name,
                  commandOptions: {
                    protocolId: hp.id,
                  },
                  disabled: !areValid,
                };
              })
              .filter(preset => preset !== null);
          };

          return generateAdvancedPresets({ servicesManager });
        },
        'layoutSelector.commonPresets': [
          {
            icon: 'layout-common-1x1',
            commandOptions: {
              numRows: 1,
              numCols: 1,
            },
          },
          {
            icon: 'layout-common-1x2',
            commandOptions: {
              numRows: 1,
              numCols: 2,
            },
          },
          {
            icon: 'layout-common-2x2',
            commandOptions: {
              numRows: 2,
              numCols: 2,
            },
          },
          {
            icon: 'layout-common-2x3',
            commandOptions: {
              numRows: 2,
              numCols: 3,
            },
          },
        ],
        'cornerstone.overlayViewportTools': {
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
              bindings: [{ mouseButton: Enums.MouseBindings.Secondary }],
            },
            {
              toolName: toolNames.StackScroll,
              bindings: [{ mouseButton: Enums.MouseBindings.Wheel }],
            },
          ],
          enabled: [
            {
              toolName: toolNames.PlanarFreehandContourSegmentation,
              configuration: {
                displayOnePointAsCrosshairs: true,
              },
            },
          ],
        },
        'cornerstone.windowLevelPresets': defaultWindowLevelPresets,
        'cornerstone.colorbar': {
          width: '16px',
          colorbarTickPosition: 'left',
          colormaps,
          colorbarContainerPosition: 'right',
          colorbarInitialColormap: DefaultColormap,
        },
        'cornerstone.3dVolumeRendering': {
          volumeRenderingPresets: VIEWPORT_PRESETS,
          volumeRenderingQualityRange: {
            min: 1,
            max: 4,
            step: 1,
          },
        },
        'cornerstone.measurements': {
          Angle: {
            displayText: [],
            report: [],
          },
          CobbAngle: {
            displayText: [],
            report: [],
          },
          ArrowAnnotate: {
            displayText: [],
            report: [],
          },
          RectangleROi: {
            displayText: [],
            report: [],
          },
          CircleROI: {
            displayText: [],
            report: [],
          },
          EllipticalROI: {
            displayText: [],
            report: [],
          },
          Bidirectional: {
            displayText: [],
            report: [],
          },
          Length: {
            displayText: [],
            report: [],
          },
          LivewireContour: {
            displayText: [],
            report: [],
          },
          SplineROI: {
            displayText: [
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                value: 'areaUnits',
                for: ['area'],
                type: 'unit',
              },
              /**
              {
                displayName: 'Modality',
                value: 'Modality',
                type: 'value',
              },
              */
            ],
            report: [
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                displayName: 'Unit',
                value: 'areaUnits',
                type: 'value',
              },
            ],
          },
          PlanarFreehandROI: {
            displayTextOpen: [
              {
                displayName: 'Length',
                value: 'length',
                type: 'value',
              },
            ],
            displayText: [
              {
                displayName: 'Mean',
                value: 'mean',
                type: 'value',
              },
              {
                displayName: 'Max',
                value: 'max',
                type: 'value',
              },
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                value: 'pixelValueUnits',
                for: ['mean', 'max' /** 'stdDev **/],
                type: 'unit',
              },
              {
                value: 'areaUnits',
                for: ['area'],
                type: 'unit',
              },
              /**
              {
                displayName: 'Std Dev',
                value: 'stdDev',
                type: 'value',
              },
              */
            ],
            report: [
              {
                displayName: 'Mean',
                value: 'mean',
                type: 'value',
              },
              {
                displayName: 'Max',
                value: 'max',
                type: 'value',
              },
              {
                displayName: 'Area',
                value: 'area',
                type: 'value',
              },
              {
                displayName: 'Unit',
                value: 'unit',
                type: 'value',
              },
            ],
          },
        },
      },
    },
  ];
}

export default getCustomizationModule;
