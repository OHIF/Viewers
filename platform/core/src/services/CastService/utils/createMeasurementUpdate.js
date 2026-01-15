export default function createMeasurementUpdate(measurement, studyMeta, annotationData = null) {
  const fhirContext = {
    id: '',
    timestamp: '',
    event: {
      'hub.topic': '{topic}',
      'hub.event': 'measurement-update',
      context: [
        {
          key: 'measurement',
          resource: {
            resourceType: 'Measurement',
            uid: measurement.uid,
            SOPInstanceUID: measurement.SOPInstanceUID,
            referenceStudyUID: measurement.referenceStudyUID,
            referenceSeriesUID: measurement.referenceSeriesUID,
            frameNumber: measurement.frameNumber,
            toolName: measurement.toolName || '',
            label: measurement.label || '',
            displayText: measurement.displayText || {},
            data: measurement.data || {},
            points: measurement.points || [],
            type: measurement.type || '',
            modifiedTimestamp: measurement.modifiedTimestamp || Math.floor(Date.now() / 1000),
            referencedImageId: measurement.referencedImageId || '',
            displaySetInstanceUID: measurement.displaySetInstanceUID || '',
            // Include annotation data if available
            annotation: annotationData ? {
              data: {
                handles: annotationData.data?.handles || {},
                cachedStats: annotationData.data?.cachedStats || {},
                label: annotationData.data?.label || measurement.label || '',
                text: annotationData.data?.text || measurement.label || '',
                frameNumber: annotationData.data?.frameNumber || measurement.frameNumber || 1,
                ...(annotationData.data || {}),
              },
              metadata: annotationData.metadata || {},
            } : null,
          },
        },
      ],
    },
  };

  return fhirContext;
}

