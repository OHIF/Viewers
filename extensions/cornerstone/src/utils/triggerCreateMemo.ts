import { getRenderingEngines } from '@cornerstonejs/core';
import { Types as csToolTypes, AnnotationTool } from '@cornerstonejs/tools';

export const triggerCreateAnnotationMemo = ({
  annotation,
  FrameOfReferenceUID,
  options,
}: {
  annotation: csToolTypes.Annotation;
  FrameOfReferenceUID: string;
  options: { newAnnotation?: boolean; deleting?: boolean };
}): void => {
  const { newAnnotation, deleting } = options;
  const renderingEngines = getRenderingEngines();
  const viewports = renderingEngines.flatMap(re => re.getViewports());
  const validViewport = viewports.find(vp => vp.getFrameOfReferenceUID() === FrameOfReferenceUID);

  if (!validViewport) {
    return;
  }

  AnnotationTool.createAnnotationMemo(validViewport.element, annotation, {
    newAnnotation,
    deleting,
  });
};

export default triggerCreateAnnotationMemo;
