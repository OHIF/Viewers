import { getEnabledElement } from '@cornerstonejs/core';
import { IEnabledElement } from '@cornerstonejs/core/dist/esm/types';

import { getEnabledElement as OHIFgetEnabledElement } from '../state';

export default function getActiveViewportEnabledElement(viewportGridService): IEnabledElement {
  const { activeViewportId } = viewportGridService.getState();
  const { element } = OHIFgetEnabledElement(activeViewportId) || {};
  const enabledElement = getEnabledElement(element);
  return enabledElement;
}
