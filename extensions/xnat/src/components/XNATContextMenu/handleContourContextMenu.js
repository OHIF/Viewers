import csTools from 'cornerstone-tools';
import { commandsManager, servicesManager } from '@ohif/viewer/src/App';
import XNATContextMenu from './XNATContextMenu';
import { Polygon, generateUID, PEPPERMINT_TOOL_NAMES } from '../../peppermint-tools'
import refreshViewports from '../../utils/refreshViewports';

const modules = csTools.store.modules;
const globalToolStateManager = csTools.globalImageIdSpecificToolStateManager;

const { FREEHAND_ROI_3D_TOOL } = PEPPERMINT_TOOL_NAMES;

const _getDefaultPosition = event => ({
  x: (event && event.currentPoints.client.x) || 0,
  y: (event && event.currentPoints.client.y) || 0,
});

function handleContourContextMenu(event, callbackData) {
  const eventData = event.detail;
  const module = modules.freehand3D;
  const { UIDialogService } = servicesManager.services;

  UIDialogService.create({
    id: 'context-menu',
    isDraggable: false,
    preservePosition: false,
    defaultPosition: _getDefaultPosition(event.detail),
    content: XNATContextMenu,
    contentProps: {
      eventData: eventData,
      callbackData: callbackData,
      onClose: () => {
        UIDialogService.dismiss({ id: 'context-menu' })
      },
      onDelete: () => {
        const element = eventData.element;
        commandsManager.runCommand('xnatRemoveToolState', {
          element,
          toolType: callbackData.nearbyToolData.toolType,
          tool: callbackData.nearbyToolData.tool,
        });
      },
      onCopy: () => {
        console.log('Copy contour...');
        const points = [];
        const {
          seriesInstanceUid,
          referencedStructureSet,
          referencedROIContour,
          handles,
        } = callbackData.nearbyToolData.tool;

        for (let i = 0; i < handles.points.length; i++) {
          points.push({
            x: handles.points[i].x,
            y: handles.points[i].y,
          });
        }

        module.clipboard.data = {
          seriesInstanceUid: seriesInstanceUid,
          structureSetUid: referencedStructureSet.uid,
          ROIContourUid: referencedROIContour.uid,
          points: points
        };
      },
      OnPaste: () => {
        console.log('Paste contour...');
        if (!module.clipboard.data) {
          return;
        }

        const copiedData = module.clipboard.data;

        // check if it is the same series
        const series = modules.freehand3D.getters.series(copiedData.seriesInstanceUid);
        if (series.uid !== copiedData.seriesInstanceUid) {
          // ToDo: show a UI error message
          console.warn('Cannot paste contour over a different scan');
          return;
        }

        const roiContour = modules.freehand3D.getters.activeROIContour(series.uid);

        const polygon = new Polygon(
          copiedData.points,
          null,
          copiedData.seriesInstanceUid,
          copiedData.structureSetUid,
          roiContour.uid, //copiedData.ROIContourUid,
          generateUID(),
          null,
          false
        );

        const toolStateManager = globalToolStateManager.saveToolState();

        const imageId = eventData.image.imageId;

        if (!toolStateManager[imageId]) {
          toolStateManager[imageId] = {};
        }

        const imageToolState = toolStateManager[imageId];

        if (!imageToolState[FREEHAND_ROI_3D_TOOL]) {
          imageToolState[FREEHAND_ROI_3D_TOOL] = {};
          imageToolState[FREEHAND_ROI_3D_TOOL].data = [];
        } else if (!imageToolState[FREEHAND_ROI_3D_TOOL].data) {
          imageToolState[FREEHAND_ROI_3D_TOOL].data = [];
        }

        imageToolState[FREEHAND_ROI_3D_TOOL].data.push(
          polygon.getFreehandToolData(false)
        );

        modules.freehand3D.setters.incrementPolygonCount(
          copiedData.seriesInstanceUid,
          copiedData.structureSetUid,
          roiContour.uid, //copiedData.ROIContourUid
        );

        refreshViewports();
      },
      onEmpty: () => {
        console.log('Empty contour clipboard...');
        module.clipboard.data = undefined;
      },
    },
  });
}

export { handleContourContextMenu };
