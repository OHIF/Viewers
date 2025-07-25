const SRSCOOR3DProbe = {
  toAnnotation: measurement => {},

  /**
   * Maps cornerstone annotation event data to measurement service format.
   *
   * @param {Object} cornerstone Cornerstone event data
   * @return {Measurement} Measurement instance
   */
  toMeasurement: ({ servicesManager, getValueTypeFromToolType }, csToolsEventDetail) => {
    const { displaySetService } = servicesManager.services;
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;

    if (!metadata || !data) {
      console.warn('Probe tool: Missing metadata or data');
      return null;
    }

    const { toolName, FrameOfReferenceUID } = metadata;
    const { points } = data.handles;

    const displaySets = displaySetService
      .getActiveDisplaySets()
      .filter(ds => ds.FrameOfReferenceUID === FrameOfReferenceUID);
    const displaySet = displaySets.filter(ds => ds.isReconstructable)[0] || displaySets[0];

    const { StudyInstanceUID: referenceStudyUID, SeriesInstanceUID: referenceSeriesUID } =
      displaySets[0] || {};

    const displayText = getDisplayText(annotation);
    return {
      uid: annotationUID,
      points,
      metadata,
      referenceStudyUID,
      referenceSeriesUID,
      displaySetInstanceUID: displaySet?.displaySetInstanceUID,
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

  return {
    primary: displayText,
    secondary: [],
  };
}

export default SRSCOOR3DProbe;
