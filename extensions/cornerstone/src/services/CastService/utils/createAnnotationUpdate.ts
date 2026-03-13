/**
 * Creates an annotation-update cast message for syncing annotation (and optional measurement) to the hub.
 */

export interface AnnotationLike {
  annotationUID?: string;
  uid?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface MeasurementLike {
  uid: string;
  SOPInstanceUID?: string;
  referenceStudyUID?: string;
  referenceSeriesUID?: string;
  frameNumber?: number;
  toolName?: string;
  label?: string;
  displayText?: Record<string, unknown>;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  points?: unknown[];
  type?: string;
  modifiedTimestamp?: number;
  referencedImageId?: string;
  displaySetInstanceUID?: string;
}

export interface AnnotationUpdateCastMessage {
  id: string;
  timestamp: string;
  event: {
    'hub.topic': string;
    'hub.event': 'annotation-update';
    context: Array<{
      key: string;
      resource: {
        resourceType: string;
        uid: string;
        data: Record<string, unknown>;
        metadata: Record<string, unknown>;
        measurement: Record<string, unknown> | null;
      };
    }>;
  };
}

export default function createAnnotationUpdate(
  annotation: AnnotationLike,
  measurement: MeasurementLike | null = null,
  _studyMeta: unknown = null
): AnnotationUpdateCastMessage {
  const castContext: AnnotationUpdateCastMessage = {
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
            uid: annotation.annotationUID ?? annotation.uid ?? '',
            data: annotation.data ?? {},
            metadata: annotation.metadata ?? {},
            measurement: measurement
              ? {
                  uid: measurement.uid,
                  SOPInstanceUID: measurement.SOPInstanceUID,
                  referenceStudyUID: measurement.referenceStudyUID,
                  referenceSeriesUID: measurement.referenceSeriesUID,
                  frameNumber: measurement.frameNumber,
                  toolName: measurement.toolName ?? '',
                  label: measurement.label ?? '',
                  displayText: measurement.displayText ?? {},
                  data: measurement.data ?? {},
                  metadata: measurement.metadata ?? {},
                  points: measurement.points ?? [],
                  type: measurement.type ?? '',
                  modifiedTimestamp:
                    measurement.modifiedTimestamp ?? Math.floor(Date.now() / 1000),
                  referencedImageId: measurement.referencedImageId ?? '',
                  displaySetInstanceUID: measurement.displaySetInstanceUID ?? '',
                }
              : null,
          },
        },
      ],
    },
  };
  return castContext;
}
