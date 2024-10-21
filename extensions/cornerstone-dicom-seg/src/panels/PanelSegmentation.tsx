import { createReportAsync } from '@ohif/extension-default';
import React, { useEffect, useState } from 'react';
import { SegmentationTable } from '@ohif/ui-next';
import callInputDialog from './callInputDialog';
import { colorPickerDialog } from '@ohif/extension-default';

export default function PanelSegmentation({
  servicesManager,
  commandsManager,
  extensionManager,
  configuration,
}: withAppTypes) {
  const { segmentationService, viewportGridService, uiDialogService, customizationService } =
    servicesManager.services;

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
    toggleRenderInactiveSegmentations: () => {
      const viewportId = viewportGridService.getActiveViewportId();
      const renderInactive = segmentationService.getRenderInactiveSegmentations(viewportId);
      segmentationService.setRenderInactiveSegmentations(viewportId, !renderInactive);
    },

    onSegmentationRemoveFromViewport: segmentationId => {
      segmentationService.removeSegmentationRepresentations(
        viewportGridService.getActiveViewportId(),
        {
          segmentationId,
        }
      );
    },

    onSegmentationDelete: segmentationId => {
      segmentationService.remove(segmentationId);
    },

    setFillAlpha: ({ type }, value: number) =>
      segmentationService.setStyle({ type }, { fillAlpha: value }),

    setOutlineWidth: ({ type }, value: number) =>
      segmentationService.setStyle({ type }, { outlineWidth: value }),

    getRenderInactiveSegmentations: () =>
      segmentationService.getRenderInactiveSegmentations(viewportGridService.getActiveViewportId()),

    setRenderFill: ({ type }, value: boolean) =>
      segmentationService.setStyle({ type }, { renderFill: value }),

    setRenderOutline: ({ type }, value: boolean) =>
      segmentationService.setStyle({ type }, { renderOutline: value }),

    setFillAlphaInactive: ({ type }, value: number) =>
      segmentationService.setStyle({ type }, { fillAlphaInactive: value }),
  };

  // Merge configuration into handlers
  const handlers = {
    ...initialHandlers,
  };

  const { disableEditing } = configuration ?? {};

  const { mode: SegmentationTableMode } = customizationService.getCustomization(
    'segmentationTable.mode',
    {
      id: 'default.segmentationTable.mode',
      mode: 'collapsed',
    }
  );

  // custom onSegmentationAdd if provided
  const { onSegmentationAdd } = customizationService.getCustomization(
    'segmentation.onSegmentationAdd',
    {
      id: 'segmentation.onSegmentationAdd',
      onSegmentationAdd: handlers.onSegmentationAdd,
    }
  );

  return (
    <SegmentationTable
      data={segmentationsInfo}
      mode={SegmentationTableMode}
      title="Segmentations"
      disableEditing={disableEditing}
      onSegmentationAdd={onSegmentationAdd}
      onSegmentationClick={handlers.onSegmentationClick}
      onSegmentationDelete={handlers.onSegmentationDelete}
      onSegmentAdd={handlers.onSegmentAdd}
      onSegmentClick={handlers.onSegmentClick}
      onSegmentEdit={handlers.onSegmentEdit}
      onSegmentationEdit={handlers.onSegmentationEdit}
      onSegmentColorClick={handlers.onSegmentColorClick}
      onSegmentDelete={handlers.onSegmentDelete}
      onToggleSegmentVisibility={handlers.onToggleSegmentVisibility}
      onToggleSegmentLock={handlers.onToggleSegmentLock}
      onToggleSegmentationVisibility={handlers.onToggleSegmentationVisibility}
      onSegmentationDownload={handlers.onSegmentationDownload}
      storeSegmentation={handlers.storeSegmentation}
      onSegmentationDownloadRTSS={handlers.onSegmentationDownloadRTSS}
      setStyle={handlers.setStyle}
      toggleRenderInactiveSegmentations={handlers.toggleRenderInactiveSegmentations}
      onSegmentationRemoveFromViewport={handlers.onSegmentationRemoveFromViewport}
      setFillAlpha={handlers.setFillAlpha}
      setOutlineWidth={handlers.setOutlineWidth}
      renderInactiveSegmentations={handlers.getRenderInactiveSegmentations()}
      setRenderFill={handlers.setRenderFill}
      setRenderOutline={handlers.setRenderOutline}
      setFillAlphaInactive={handlers.setFillAlphaInactive}
    >
      <SegmentationTable.Config />
      <SegmentationTable.AddSegmentationRow />

      {SegmentationTableMode === 'collapsed' ? (
        <SegmentationTable.Collapsed>
          <SegmentationTable.SelectorHeader />
          <SegmentationTable.AddSegmentRow />
          <SegmentationTable.Segments />
        </SegmentationTable.Collapsed>
      ) : (
        <SegmentationTable.Expanded>
          <SegmentationTable.Header />
          {/* <SegmentationTable.AddSegmentRow /> */}
          <SegmentationTable.Segments />
        </SegmentationTable.Expanded>
      )}
    </SegmentationTable>
  );
}
