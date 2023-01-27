import { value getEnabledElement } from '@cornerstonejs/core';
import { value IEnabledElement } from '@cornerstonejs/core/dist/esm/types';

import { value getEnabledElement as OHIFgetEnabledElement } from '../state';

export default function getActiveViewportEnabledElement(
  viewportGridService
): IEnabledElement {
  const { activeViewportIndex } = viewportGridService.getState();
  const { element } = OHIFgetEnabledElement(activeViewportIndex) || {};
  const enabledElement = getEnabledElement(element);
  return enabledElement;
}
