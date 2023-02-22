import { getEnabledElement } from '@cornerstonejs/core';
import { IEnabledElement } from '@cornerstonejs/core/dist/esm/types';

import { getEnabledElement as OHIFgetEnabledElement } from '../state';

export default function getActiveViewportEnabledElement(
  viewportGridService
): IEnabledElement {
  const { activeViewportIndex } = viewportGridService.getState();
  const { element } = OHIFgetEnabledElement(activeViewportIndex) || {};
  const enabledElement = getEnabledElement(element);
  return enabledElement;
}
