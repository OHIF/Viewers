import { createReportAsync } from '@ohif/extension-default';
import React, { useEffect, useState } from 'react';
import {
  PanelSection,
  SegmentationDropDownRow,
  Button,
  Icons,
  ScrollArea,
  NoSegmentationRow,
  SegmentationConfig,
  DataRow,
} from '@ohif/ui-next';
import callInputDialog from './callInputDialog';
import { colorPickerDialog } from '@ohif/extension-default';
import { useTranslation } from 'react-i18next';

// const components = {
//   [SegmentationPanelMode.Expanded]: SegmentationGroupTableExpanded,
//   [SegmentationPanelMode.Dropdown]: SegmentationGroupTable,
// };

export default function PanelSegmentation({
  servicesManager,
  commandsManager,
  extensionManager,
  configuration,
  renderHeader,
  getCloseIcon,
  tab,
}: withAppTypes) {
  const { segmentationService, viewportGridService, uiDialogService } = servicesManager.services;

  const { t } = useTranslation('PanelSegmentation');

  const [segmentationsInfo, setSegmentationsInfo] = useState(() =>
    segmentationService.getSegmentationsInfo({
      viewportId: viewportGridService.getActiveViewportId(),
    })
  );

  useEffect(() => {
    const eventSubscriptions = [
      {
        service: segmentationService,
        events: [
          segmentationService.EVENTS.SEGMENTATION_MODIFIED,
          segmentationService.EVENTS.SEGMENTATION_REMOVED,
          segmentationService.EVENTS.SEGMENTATION_REPRESENTATION_MODIFIED,
        ],
      },
      {
        service: viewportGridService,
        events: [
          viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
          viewportGridService.EVENTS.GRID_STATE_CHANGED,
        ],
      },
    ];

    // Handler to update segmentations info
    const updateSegmentationsInfo = () => {
      const viewportId = viewportGridService.getActiveViewportId();
      const segmentationsInfo = segmentationService.getSegmentationsInfo({ viewportId });
      setSegmentationsInfo(segmentationsInfo);
    };

    // Subscribe to all events and collect unsubscribe functions
    const allUnsubscribeFunctions = eventSubscriptions.flatMap(({ service, events }) =>
      events.map(evt => {
        const { unsubscribe } = service.subscribe(evt, updateSegmentationsInfo);
        return unsubscribe;
      })
    );

    return () => {
      allUnsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [viewportGridService, segmentationService]);

  const initialHandlers = {
    onSegmentationAdd: async () => {
      segmentationService.createEmptyLabelmapForViewport(viewportGridService.getActiveViewportId());
    },

    onSegmentationClick: (segmentationId: string) => {
      segmentationService.setActiveSegmentation(
        viewportGridService.getActiveViewportId(),
        segmentationId
      );
    },

    onSegmentationDelete: (segmentationId: string) => {
      segmentationService.remove(segmentationId);
    },

    onSegmentAdd: segmentationId => {
      segmentationService.addSegment(segmentationId);
    },

    onSegmentClick: (segmentationId, segmentIndex) => {
      segmentationService.setActiveSegment(segmentationId, segmentIndex);
      segmentationService.jumpToSegmentCenter(segmentationId, segmentIndex);
    },

    onSegmentEdit: (segmentationId, segmentIndex) => {
      const segmentations = segmentationService.getSegmentationsInfo({ segmentationId });

      if (!segmentations?.length) {
        return;
      }

      const segmentation = segmentations[0].segmentation;

      const segment = segmentation.segments[segmentIndex];
      const { label } = segment;

      callInputDialog(uiDialogService, label, (label, actionId) => {
        if (label === '') {
          return;
        }

        segmentationService.setSegmentLabel(segmentationId, segmentIndex, label);
      });
    },

    onSegmentationEdit: segmentationId => {
      const segmentations = segmentationService.getSegmentationsInfo({ segmentationId });

      if (!segmentations?.length) {
        return;
      }

      const segmentation = segmentations[0].segmentation;
      const { label } = segmentation;

      callInputDialog(uiDialogService, label, (label, actionId) => {
        if (label === '') {
          return;
        }

        segmentationService.addOrUpdateSegmentation(segmentationId, { label: label });
      });
    },

    onSegmentColorClick: (segmentationId, segmentIndex) => {
      const viewportId = viewportGridService.getActiveViewportId();
      const color = segmentationService.getSegmentColor(viewportId, segmentationId, segmentIndex);

      const rgbaColor = {
        r: color[0],
        g: color[1],
        b: color[2],
        a: color[3] / 255.0,
      };
      colorPickerDialog(uiDialogService, rgbaColor, (newRgbaColor, actionId) => {
        if (actionId === 'cancel') {
          return;
        }

        const color = [newRgbaColor.r, newRgbaColor.g, newRgbaColor.b, newRgbaColor.a * 255.0];
        segmentationService.setSegmentColor(viewportId, segmentationId, segmentIndex, color);
      });
    },

    onSegmentDelete: (segmentationId, segmentIndex) => {
      segmentationService.removeSegment(segmentationId, segmentIndex);
    },

    onToggleSegmentVisibility: (segmentationId, segmentIndex) => {
      segmentationService.toggleSegmentVisibility(
        viewportGridService.getActiveViewportId(),
        segmentationId,
        segmentIndex
      );
    },

    onToggleSegmentLock: (segmentationId, segmentIndex) => {
      segmentationService.toggleSegmentLocked(segmentationId, segmentIndex);
    },

    onToggleSegmentationVisibility: segmentationId => {
      segmentationService.toggleSegmentationVisibility(
        viewportGridService.getActiveViewportId(),
        segmentationId
      );
    },

    onSegmentationDownload: segmentationId => {
      commandsManager.runCommand('downloadSegmentation', {
        segmentationId,
      });
    },

    storeSegmentation: async segmentationId => {
      const datasources = extensionManager.getActiveDataSource();

      const displaySetInstanceUIDs = await createReportAsync({
        servicesManager,
        getReport: () =>
          commandsManager.runCommand('storeSegmentation', {
            segmentationId,
            dataSource: datasources[0],
          }),
        reportType: 'Segmentation',
      });

      // Show the exported report in the active viewport as read only (similar to SR)
      if (displaySetInstanceUIDs) {
        // clear the segmentation that we exported, similar to the storeMeasurement
        // where we remove the measurements and prompt again the user if they would like
        // to re-read the measurements in a SR read only viewport
        segmentationService.remove(segmentationId);

        viewportGridService.setDisplaySetsForViewport({
          viewportId: viewportGridService.getActiveViewportId(),
          displaySetInstanceUIDs,
        });
      }
    },

    onSegmentationDownloadRTSS: segmentationId => {
      commandsManager.runCommand('downloadRTSS', {
        segmentationId,
      });
    },

    setStyle: (segmentationId, type, key, value) => {
      // Todo: make this more granular and allow per segmentaion styles
      segmentationService.setStyle({ type }, { [key]: value });
    },

    // New handler for toggling render inactive segmentations
    toggleRenderInactiveSegmentations: toggle => {
      const viewportId = viewportGridService.getActiveViewportId();
      segmentationService.setRenderInactiveSegmentations(viewportId, toggle);
    },

    onSegmentationRemoveFromViewport: segmentationId => {
      segmentationService.removeSegmentationRepresentations(
        viewportGridService.getActiveViewportId(),
        {
          segmentationId,
        }
      );
    },
  };

  // Merge configuration into handlers
  const handlers = {
    ...initialHandlers,
    onSegmentationAdd:
      typeof configuration?.onSegmentationAdd === 'function'
        ? configuration.onSegmentationAdd
        : initialHandlers.onSegmentationAdd,
  };

  const {
    segmentationPanelMode,
    addSegment: allowAddSegment = true,
    disableEditing,
  } = configuration ?? {};

  // const SegmentationGroupTableComponent =
  //   components[segmentationPanelMode] ?? SegmentationGroupTable;

  if (!segmentationsInfo?.length) {
    return (
      <div className="select-none bg-black py-[3px]">
        {!disableEditing && <NoSegmentationRow onSegmentationAdd={handlers.onSegmentationAdd} />}
      </div>
    );
  }

  const activeSegmentationInfo = segmentationsInfo.find(info => info.representation.active);

  if (!activeSegmentationInfo) {
    return null;
  }

  const activeSegmentationId = activeSegmentationInfo?.segmentation.segmentationId;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-grow overflow-y-auto">
        <PanelSection title="Segmentation List">
          <SegmentationDropDownRow
            segmentations={segmentationsInfo.map(info => ({
              id: info.segmentation.segmentationId,
              label: info.segmentation.label,
              isActive: info.representation.active,
              isVisible: info.representation.visible,
              info: info.segmentation.cachedStats.info,
            }))}
            disableEditing={disableEditing}
            onActiveSegmentationChange={handlers.onSegmentationClick}
            onSegmentationRemoveFromViewport={handlers.onSegmentationRemoveFromViewport}
            onSegmentationDelete={handlers.onSegmentationDelete}
            onSegmentationEdit={handlers.onSegmentationEdit}
            onSegmentationDownload={handlers.onSegmentationDownload}
            onSegmentationDownloadRTSS={handlers.onSegmentationDownloadRTSS}
            storeSegmentation={handlers.storeSegmentation}
            onSegmentationAdd={handlers.onSegmentationAdd}
            onToggleSegmentationVisibility={handlers.onToggleSegmentationVisibility}
          />
          <SegmentationConfig
            representation={activeSegmentationInfo.representation}
            setFillAlpha={(value: number) =>
              handlers.setStyle(
                activeSegmentationId,
                activeSegmentationInfo.representation.type,
                'fillAlpha',
                value
              )
            }
            setOutlineWidth={(value: number) =>
              handlers.setStyle(
                activeSegmentationId,
                activeSegmentationInfo.representation.type,
                'outlineWidth',
                value
              )
            }
            renderInactiveSegmentations={segmentationService.getRenderInactiveSegmentations(
              viewportGridService.getActiveViewportId()
            )}
            toggleRenderInactiveSegmentations={() => {
              const viewportId = viewportGridService.getActiveViewportId();
              const renderInactive = segmentationService.getRenderInactiveSegmentations(viewportId);
              segmentationService.setRenderInactiveSegmentations(viewportId, !renderInactive);
            }}
            setRenderFill={(value: boolean) =>
              handlers.setStyle(
                activeSegmentationId,
                activeSegmentationInfo.representation.type,
                'renderFill',
                value
              )
            }
            setRenderOutline={(value: boolean) =>
              handlers.setStyle(
                activeSegmentationId,
                activeSegmentationInfo.representation.type,
                'renderOutline',
                value
              )
            }
            setFillAlphaInactive={(value: number) =>
              handlers.setStyle(
                activeSegmentationId,
                activeSegmentationInfo.representation.type,
                'fillAlphaInactive',
                value
              )
            }
          />
          {!disableEditing &&
            (() => {
              const allSegmentsVisible = Object.values(
                activeSegmentationInfo?.representation?.segments
              ).every(segment => segment?.visible !== false);

              const Icon = allSegmentsVisible ? (
                <Icons.Hide className="h-6 w-6" />
              ) : (
                <Icons.Show className="h-6 w-6" />
              );

              return (
                <div className="bg-primary-dark my-px flex h-9 w-full items-center justify-between rounded pl-0.5 pr-7">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="pr pl-0.5"
                    onClick={() => handlers.onSegmentAdd(activeSegmentationId)}
                  >
                    <Icons.Add />
                    Add Segment
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handlers.onToggleSegmentationVisibility(activeSegmentationId)}
                  >
                    {Icon}
                  </Button>
                </div>
              );
            })()}
          <ScrollArea
            className="ohif-scrollbar invisible-scrollbar bg-bkg-low h-[600px] space-y-px"
            showArrows={true}
          >
            {Object.values(activeSegmentationInfo?.representation?.segments).map(segment => {
              if (!segment) {
                return null;
              }
              const { segmentIndex, color, visible } = segment;
              const segmentFromSegmentation =
                activeSegmentationInfo?.segmentation.segments[segmentIndex];

              const { locked, active, label } = segmentFromSegmentation;
              const cssColor = `rgb(${color[0]},${color[1]},${color[2]})`;

              return (
                <DataRow
                  key={segmentIndex}
                  number={segmentIndex}
                  title={label}
                  description=""
                  colorHex={cssColor}
                  isSelected={active}
                  isVisible={visible}
                  isLocked={locked}
                  disableEditing={disableEditing}
                  onColor={() => handlers.onSegmentColorClick(activeSegmentationId, segmentIndex)}
                  onToggleVisibility={() =>
                    handlers.onToggleSegmentVisibility(activeSegmentationId, segmentIndex)
                  }
                  onToggleLocked={() =>
                    handlers.onToggleSegmentLock(activeSegmentationId, segmentIndex)
                  }
                  onSelect={() => handlers.onSegmentClick(activeSegmentationId, segmentIndex)}
                  onRename={() => handlers.onSegmentEdit(activeSegmentationId, segmentIndex)}
                  onDelete={() => handlers.onSegmentDelete(activeSegmentationId, segmentIndex)}
                />
              );
            })}
          </ScrollArea>
        </PanelSection>
      </div>
    </div>
  );
}
