import { getEnabledElement } from '@cornerstonejs/core';
import { getEnabledElement as OHIFgetEnabledElement } from '../state';

export function getViewportEnabledElement(viewportId: string) {
  const { element } = OHIFgetEnabledElement(viewportId) || {};
  const enabledElement = getEnabledElement(element);
  return enabledElement;
}
