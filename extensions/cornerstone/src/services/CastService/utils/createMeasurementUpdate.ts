/**
 * Creates a measurement-update cast message for syncing measurement (and optional annotation data) to the hub.
 */

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
  points?: unknown[];
  type?: string;
  modifiedTimestamp?: number;
  referencedImageId?: string;
  displaySetInstanceUID?: string;
}

export interface AnnotationDataLike {
  data?: {
    handles?: Record<string, unknown>;
    cachedStats?: Record<string, unknown>;
    label?: string;
    text?: string;
    frameNumber?: number;
    [key: string]: unknown;
  };
  metadata?: Record<string, unknown>;
}

export interface MeasurementUpdateCastMessage {
  id: string;
  timestamp: string;
  event: {
    'hub.topic': string;
    'hub.event': 'measurement-update';
    context: Array<{
      key: string;
      resource: Record<string, unknown>;
    }>;
  };
}

export default function createMeasurementUpdate(
  measurement: MeasurementLike,
  _studyMeta: unknown,
  annotationData: AnnotationDataLike | null = null
): MeasurementUpdateCastMessage {
  const fhirContext: MeasurementUpdateCastMessage = {
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
            toolName: measurement.toolName ?? '',
            label: measurement.label ?? '',
            displayText: measurement.displayText ?? {},
            data: measurement.data ?? {},
            points: measurement.points ?? [],
            type: measurement.type ?? '',
            modifiedTimestamp:
              measurement.modifiedTimestamp ?? Math.floor(Date.now() / 1000),
            referencedImageId: measurement.referencedImageId ?? '',
            displaySetInstanceUID: measurement.displaySetInstanceUID ?? '',
            annotation: annotationData
              ? {
                  data: {
                    handles: annotationData.data?.handles ?? {},
                    cachedStats: annotationData.data?.cachedStats ?? {},
                    label:
                      annotationData.data?.label ?? measurement.label ?? '',
                    text: annotationData.data?.text ?? measurement.label ?? '',
                    frameNumber:
                      annotationData.data?.frameNumber ??
                      measurement.frameNumber ??
                      1,
                    ...(annotationData.data ?? {}),
                  },
                  metadata: annotationData.metadata ?? {},
                }
              : null,
          },
        },
      ],
    },
  };
  return fhirContext;
}
