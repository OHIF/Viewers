/**
 * Creates an annotation-delete cast message so receivers remove the annotation by uid (and do not create).
 */

export interface AnnotationLike {
  annotationUID?: string;
  uid?: string;
}

export interface AnnotationDeleteCastMessage {
  id: string;
  timestamp: string;
  event: {
    'hub.topic': string;
    'hub.event': 'annotation-delete';
    context: Array<{
      key: string;
      resource: { resourceType: string; uid: string };
    }>;
  };
}

export default function createAnnotationDelete(
  annotation: AnnotationLike | null | undefined
): AnnotationDeleteCastMessage | null {
  const uid = annotation?.annotationUID ?? annotation?.uid;
  if (!uid) return null;
  return {
    id: '',
    timestamp: '',
    event: {
      'hub.topic': '{topic}',
      'hub.event': 'annotation-delete',
      context: [
        {
          key: 'annotation',
          resource: {
            resourceType: 'Annotation',
            uid,
          },
        },
      ],
    },
  };
}
