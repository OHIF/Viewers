import {
  getEnabledElement,
  utilities as csUtils,
  Types,
} from '@cornerstonejs/core';
import { annotation } from '@cornerstonejs/tools';

type Point3 = Types.Point3;

interface ToolGroupService {
  getToolGroupForViewport: (viewportId: string) => string | undefined;
}

export default function addRandomRectangle(
  element: HTMLDivElement,
  toolGroupService: ToolGroupService
): void {
  if (!element) {
    return;
  }

  const enabledElement = getEnabledElement(element);
  if (!enabledElement) {
    return;
  }

  const { viewport } = enabledElement;
  const { clientWidth, clientHeight } = element;

  // Generate random position and size (between 10% and 30% of viewport size)
  const width = Math.random() * (clientWidth * 0.2) + (clientWidth * 0.1);
  const height = Math.random() * (clientHeight * 0.2) + (clientHeight * 0.1);
  const x = Math.random() * (clientWidth - width);
  const y = Math.random() * (clientHeight - height);

  // Convert from screen to world coordinates
  const canvasPoints = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];

  const worldPoints = canvasPoints.map(point => {
    const worldPos = viewport.canvasToWorld([point.x, point.y]);
    return worldPos as Point3;
  });

  // Create the annotation
  const FrameOfReferenceUID = viewport.getFrameOfReferenceUID();
  const imageId = viewport.getCurrentImageId();

  const annotationUID = csUtils.uuidv4();
  const annotationToAdd = {
    annotationUID,
    highlighted: false,
    invalidated: true,
    isLocked: false,
    isVisible: true,
    metadata: {
      toolName: 'RectangleROI',
      FrameOfReferenceUID,
      referencedImageId: imageId,
    },
    data: {
      handles: {
        points: worldPoints,
        activeHandleIndex: null,
        textBox: {
          hasMoved: false,
          worldPosition: [0, 0, 0] as Point3,
          worldBoundingBox: {
            topLeft: [0, 0, 0] as Point3,
            topRight: [0, 0, 0] as Point3,
            bottomLeft: [0, 0, 0] as Point3,
            bottomRight: [0, 0, 0] as Point3,
          },
        },
      },
      label: '',
      cachedStats: {},
      frameNumber: viewport.getCurrentImageIdIndex(),
    },
  };

  // Get the tool group
  const toolGroupId = toolGroupService.getToolGroupForViewport(viewport.id);
  if (!toolGroupId) {
    return;
  }

  // Add the annotation using the tool's API
  annotation.state.addAnnotation(annotationToAdd, element);

  viewport.render();
}
