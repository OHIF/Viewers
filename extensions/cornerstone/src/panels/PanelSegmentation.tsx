import React from 'react';
import { SegmentationTable } from '@ohif/ui-next';
import { callInputDialog, colorPickerDialog, createReportAsync } from '@ohif/extension-default';
import { useActiveViewportSegmentationRepresentations } from '../hooks/useActiveViewportSegmentationRepresentations';

export default function PanelSegmentation({
  servicesManager,
  commandsManager,
  extensionManager,
  configuration,
  children,
}: withAppTypes) {
  const { segmentationService, viewportGridService, uiDialogService, customizationService } =
    servicesManager.services;

  const { segmentationsWithRepresentations, disabled } =
    useActiveViewportSegmentationRepresentations({
      servicesManager,
    });

  const handlers = {
    onSegmentationAdd: async () => {
      segmentationService.createLabelmapForViewport(viewportGridService.getActiveViewportId());
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
      const segmentation = segmentationService.getSegmentation(segmentationId);

      if (!segmentation) {
        return;
      }

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
      const segmentation = segmentationService.getSegmentation(segmentationId);

      if (!segmentation) {
        return;
      }

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

    onToggleSegmentVisibility: (segmentationId, segmentIndex, type) => {
      segmentationService.toggleSegmentVisibility(
        viewportGridService.getActiveViewportId(),
        segmentationId,
        segmentIndex,
        type
      );
    },

    onToggleSegmentLock: (segmentationId, segmentIndex) => {
      segmentationService.toggleSegmentLocked(segmentationId, segmentIndex);
    },

    onToggleSegmentationRepresentationVisibility: (segmentationId, type) => {
      segmentationService.toggleSegmentationRepresentationVisibility(
        viewportGridService.getActiveViewportId(),
        { segmentationId, type }
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

  const { mode: SegmentationTableMode } = customizationService.getCustomization(
    'PanelSegmentation.mode',
    {
      id: 'default.segmentationTable.mode',
      mode: 'collapsed',
    }
  );

  // custom onSegmentationAdd if provided
  const { onSegmentationAdd } = customizationService.getCustomization(
    'PanelSegmentation.onSegmentationAdd',
    {
      id: 'segmentation.onSegmentationAdd',
      onSegmentationAdd: handlers.onSegmentationAdd,
    }
  );

  const { disableEditing } = customizationService.getCustomization(
    'PanelSegmentation.disableEditing',
    {
      id: 'default.disableEditing',
      disableEditing: false,
    }
  );

  const { showAddSegment } = customizationService.getCustomization(
    'PanelSegmentation.showAddSegment',
    {
      id: 'default.showAddSegment',
      showAddSegment: true,
    }
  );

  return (
    <>
      <SegmentationTable
        disabled={disabled}
        data={segmentationsWithRepresentations}
        mode={SegmentationTableMode}
        title="Segmentations"
        disableEditing={disableEditing}
        onSegmentationAdd={onSegmentationAdd}
        onSegmentationClick={handlers.onSegmentationClick}
        onSegmentationDelete={handlers.onSegmentationDelete}
        showAddSegment={showAddSegment}
        onSegmentAdd={handlers.onSegmentAdd}
        onSegmentClick={handlers.onSegmentClick}
        onSegmentEdit={handlers.onSegmentEdit}
        onSegmentationEdit={handlers.onSegmentationEdit}
        onSegmentColorClick={handlers.onSegmentColorClick}
        onSegmentDelete={handlers.onSegmentDelete}
        onToggleSegmentVisibility={handlers.onToggleSegmentVisibility}
        onToggleSegmentLock={handlers.onToggleSegmentLock}
        onToggleSegmentationRepresentationVisibility={
          handlers.onToggleSegmentationRepresentationVisibility
        }
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
        {children}
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
    </>
  );
}
