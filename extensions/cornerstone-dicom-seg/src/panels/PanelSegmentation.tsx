import { createReportAsync } from '@ohif/extension-default';
import React, { useEffect, useState } from 'react';
import { SegmentationGroupTable, SegmentationGroupTableExpanded } from '@ohif/ui-next';
import { SegmentationPanelMode } from '../types/segmentation';
import callInputDialog from './callInputDialog';
import callColorPickerDialog from './colorPickerDialog';
import { useTranslation } from 'react-i18next';
import { Separator } from '@ohif/ui-next';

const components = {
  [SegmentationPanelMode.Expanded]: SegmentationGroupTableExpanded,
  [SegmentationPanelMode.Dropdown]: SegmentationGroupTable,
};

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

  const onSegmentationAdd = async () => {
    segmentationService.createEmptyLabelmapForViewport(viewportGridService.getActiveViewportId());
  };

  const onSegmentationClick = (segmentationId: string) => {
    segmentationService.setActiveSegmentation(
      viewportGridService.getActiveViewportId(),
      segmentationId
    );
  };

  const onSegmentationDelete = (segmentationId: string) => {
    segmentationService.removeSegmentationRepresentations(
      viewportGridService.getActiveViewportId(),
      {
        segmentationId,
      }
    );
  };

  const onSegmentAdd = segmentationId => {
    segmentationService.addSegment(segmentationId);
  };

  const onSegmentClick = (segmentationId, segmentIndex) => {
    segmentationService.setActiveSegment(segmentationId, segmentIndex);
    segmentationService.jumpToSegmentCenter(segmentationId, segmentIndex);
  };

  const onSegmentEdit = (segmentationId, segmentIndex) => {
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
  };

  const onSegmentationEdit = segmentationId => {
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
  };

  const onSegmentColorClick = (segmentationId, segmentIndex) => {
    const viewportId = viewportGridService.getActiveViewportId();
    const color = segmentationService.getSegmentColor(viewportId, segmentationId, segmentIndex);

    const rgbaColor = {
      r: color[0],
      g: color[1],
      b: color[2],
      a: color[3] / 255.0,
    };
    callColorPickerDialog(uiDialogService, rgbaColor, (newRgbaColor, actionId) => {
      if (actionId === 'cancel') {
        return;
      }

      const color = [newRgbaColor.r, newRgbaColor.g, newRgbaColor.b, newRgbaColor.a * 255.0];
      segmentationService.setSegmentColor(viewportId, segmentationId, segmentIndex, color);
    });
  };

  const onSegmentDelete = (segmentationId, segmentIndex) => {
    segmentationService.removeSegment(segmentationId, segmentIndex);
  };

  // segment hide
  const onToggleSegmentVisibility = (segmentationId, segmentIndex) => {
    segmentationService.toggleSegmentVisibility(
      viewportGridService.getActiveViewportId(),
      segmentationId,
      segmentIndex
    );
  };

  const onToggleSegmentLock = (segmentationId, segmentIndex) => {
    segmentationService.toggleSegmentLocked(segmentationId, segmentIndex);
  };

  const onToggleSegmentationVisibility = segmentationId => {
    segmentationService.toggleSegmentationVisibility(
      viewportGridService.getActiveViewportId(),
      segmentationId
    );
  };

  const onSegmentationDownload = segmentationId => {
    commandsManager.runCommand('downloadSegmentation', {
      segmentationId,
    });
  };

  const storeSegmentation = async segmentationId => {
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
  };

  const onSegmentationDownloadRTSS = segmentationId => {
    commandsManager.runCommand('downloadRTSS', {
      segmentationId,
    });
  };

  const {
    segmentationPanelMode,
    addSegment: allowAddSegment = true,
    onSegmentationAdd: configOnSegmentationAdd,
    disableEditing,
  } = configuration ?? {};

  const SegmentationGroupTableComponent =
    components[segmentationPanelMode] ?? SegmentationGroupTable;

  const onSegmentationAddWrapper =
    typeof configOnSegmentationAdd === 'function' ? configOnSegmentationAdd : onSegmentationAdd;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {renderHeader && (
        <>
          <div className="bg-primary-dark flex select-none rounded-t pt-1.5 pb-[2px]">
            <div className="flex h-[24px] w-full cursor-pointer select-none justify-center self-center text-[14px]">
              <div className="text-primary-active flex grow cursor-pointer select-none justify-center self-center text-[13px]">
                <span>{tab.label}</span>
              </div>
            </div>

            {getCloseIcon()}
          </div>
          <Separator
            orientation="horizontal"
            className="bg-black"
            thickness="2px"
          />
        </>
      )}
      <div className="flex-grow overflow-y-auto">
        <SegmentationGroupTableComponent
          title={t('Segmentations')}
          segmentationsInfo={segmentationsInfo}
          disableEditing={disableEditing}
          onSegmentationAdd={onSegmentationAddWrapper}
          showAddSegment={allowAddSegment}
          onSegmentationClick={onSegmentationClick}
          onSegmentationDelete={onSegmentationDelete}
          onSegmentationDownload={onSegmentationDownload}
          onSegmentationDownloadRTSS={onSegmentationDownloadRTSS}
          storeSegmentation={storeSegmentation}
          onSegmentationEdit={onSegmentationEdit}
          onSegmentClick={onSegmentClick}
          onSegmentEdit={onSegmentEdit}
          onSegmentAdd={onSegmentAdd}
          onSegmentColorClick={onSegmentColorClick}
          onSegmentDelete={onSegmentDelete}
          onToggleSegmentVisibility={onToggleSegmentVisibility}
          onToggleLock={onToggleSegmentLock}
          onToggleSegmentationVisibility={onToggleSegmentationVisibility}
          showDeleteSegment={true}
        />
      </div>
    </div>
  );
}
