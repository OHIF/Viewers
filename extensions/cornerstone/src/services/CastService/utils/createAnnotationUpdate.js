export default function createAnnotationUpdate(annotation, measurement = null, studyMeta = null) {
  const castContext = {
    id: '',
    timestamp: '',
    event: {
      'hub.topic': '{topic}',
      'hub.event': 'annotation-update',
      context: [
        {
          key: 'annotation',
          resource: {
            resourceType: 'Annotation',
            uid: annotation.annotationUID || annotation.uid,
            // Annotation data
            data: annotation.data || {},
            metadata: annotation.metadata || {},
            // Optional measurement data (if annotation has associated measurement)
            measurement: measurement ? {
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
            } : null,
          },
        },
      ],
    },
  };

  return castContext;
}
