import RectangleROIStartEndThreshold from './RectangleROIStartEndThreshold';

function validateAnnotation(annotation) {
  if (!annotation?.data) {
    throw new Error('Tool data is empty');
  }

  if (!annotation.metadata || annotation.metadata.referenceImageId) {
    throw new Error('Tool data is not associated with any imageId');
  }
}

class AnnotationToPointData {
  constructor() {}

  static convert(annotation, index, metadataProvider) {
    validateAnnotation(annotation);

    const { toolName } = annotation.metadata;
    const toolClass = AnnotationToPointData.TOOL_NAMES[toolName];

    if (!toolClass) {
      throw new Error(`Unknown tool type: ${toolName}, cannot convert to RTSSReport`);
    }

    // Each toolData should become a list of contours, ContourSequence
    // contains a list of contours with their pointData, their geometry
    // type and their length.
    const ContourSequence = toolClass.getContourSequence(annotation, metadataProvider);

    // Todo: random rgb color for now, options should be passed in
    const color = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];

    return {
      ReferencedROINumber: index + 1,
      ROIDisplayColor: color,
      ContourSequence,
    };
  }

  static register(toolClass) {
    AnnotationToPointData.TOOL_NAMES[toolClass.toolName] = toolClass;
  }
}

AnnotationToPointData.TOOL_NAMES = {};
AnnotationToPointData.register(RectangleROIStartEndThreshold);

export default AnnotationToPointData;
