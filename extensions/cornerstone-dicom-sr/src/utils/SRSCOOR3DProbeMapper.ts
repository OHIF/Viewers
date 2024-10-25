const SRSCOOR3DProbe = {
  toAnnotation: measurement => {},

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone Cornerstone event data
   * @return {Measurement} Measurement instance
   */
  toMeasurement: (
    csToolsEventDetail,
    displaySetService,
    CornerstoneViewportService,
    getValueTypeFromToolType,
    customizationService
  ) => {
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;

    if (!metadata || !data) {
      console.warn('Probe tool: Missing metadata or data');
      return null;
    }

    const { toolName } = metadata;
    const { points } = data.handles;

    const displayText = getDisplayText(annotation);
    return {
      uid: annotationUID,
      points,
      metadata,
      toolName: metadata.toolName,
      label: data.label,
      displayText: displayText,
      data: data.cachedStats,
      type: getValueTypeFromToolType?.(toolName) ?? null,
    };
  },
};

function getDisplayText(annotation) {
  const { data } = annotation;

  if (!data) {
    return [''];
  }
  const { labels } = data;

  const displayText = [];

  for (const label of labels) {
    // make this generic
    if (label.label === '33636980076') {
      displayText.push(`Finding Site: ${label.value}`);
    }
  }

  return displayText;
}

export default SRSCOOR3DProbe;
