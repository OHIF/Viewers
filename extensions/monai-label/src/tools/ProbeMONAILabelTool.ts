/*
Copyright (c) MONAI Consortium
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { ProbeTool, annotation, drawing } from '@cornerstonejs/tools';

const { getAnnotations } = annotation.state;

export default class ProbeMONAILabelTool extends ProbeTool {
  static toolName = 'ProbeMONAILabel';

  constructor(
    toolProps = {},
    defaultToolProps = {
      configuration: {
        customColor: undefined,
      },
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  renderAnnotation = (enabledElement, svgDrawingHelper): boolean => {
    let renderStatus = false;
    const { viewport } = enabledElement;
    const { element } = viewport;

    let annotations = getAnnotations(this.getToolName(), element);

    if (!annotations?.length) {
      return renderStatus;
    }

    annotations = this.filterInteractableAnnotationsForElement(
      element,
      annotations
    );

    if (!annotations?.length) {
      return renderStatus;
    }

    const targetId = this.getTargetId(viewport);
    const renderingEngine = viewport.getRenderingEngine();

    const styleSpecifier: StyleSpecifier = {
      toolGroupId: this.toolGroupId,
      toolName: this.getToolName(),
      viewportId: enabledElement.viewport.id,
    };

    for (let i = 0; i < annotations.length; i++) {
      const annotation = annotations[i] as ProbeAnnotation;
      const annotationUID = annotation.annotationUID;
      const data = annotation.data;
      const point = data.handles.points[0];
      const canvasCoordinates = viewport.worldToCanvas(point);

      styleSpecifier.annotationUID = annotationUID;

      const color =
        this.configuration?.customColor ??
        this.getStyle('color', styleSpecifier, annotation);

      // If rendering engine has been destroyed while rendering
      if (!viewport.getRenderingEngine()) {
        console.warn('Rendering Engine has been destroyed');
        return renderStatus;
      }

      const handleGroupUID = '0';

      drawing.drawHandles(
        svgDrawingHelper,
        annotationUID,
        handleGroupUID,
        [canvasCoordinates],
        { color }
      );

      renderStatus = true;
    }

    return renderStatus;
  };
}
