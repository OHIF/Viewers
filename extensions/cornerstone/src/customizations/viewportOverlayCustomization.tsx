export default {
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
  // VF-REG-1 / #6256: always-visible overlay surface (not viewportActionMenu).
  // Remove or override this entry to disable (VF-CFG-1).
  'viewportOverlay.topRight': [
    {
      id: 'FidelityIndicator',
      inheritsFrom: 'ohif.overlayItem.fidelity',
      title: 'Image fidelity',
    },
  ],
  'viewportOverlay.bottomLeft': [
    {
      id: 'WindowLevel',
      inheritsFrom: 'ohif.overlayItem.windowLevel',
      title: 'Window Level',
    },
    {
      id: 'ZoomLevel',
      inheritsFrom: 'ohif.overlayItem.zoomLevel',
      condition: props => {
        const activeToolName = props.toolGroupService.getActiveToolForViewport(props.viewportId);
        return activeToolName === 'Zoom';
      },
    },
  ],
  'viewportOverlay.bottomRight': [
    {
      id: 'InstanceNumber',
      inheritsFrom: 'ohif.overlayItem.instanceNumber',
      title: 'Instance Number',
    },
  ],
};
