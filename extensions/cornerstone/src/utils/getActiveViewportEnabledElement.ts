import { getEnabledElement } from '@cornerstonejs/core';
import { IEnabledElement } from '@cornerstonejs/core/types';

import { getEnabledElement as OHIFgetEnabledElement } from '../state';
import { ViewportGridService } from '@ohif/core';

export default function getActiveViewportEnabledElement(viewportGridService: ViewportGridService, viewportId: string): IEnabledElement {
  if (viewportId) {
    const { element } = OHIFgetEnabledElement(viewportId) || {};
    const enabledElement = getEnabledElement(element);
    return enabledElement;
  }

  const { activeViewportId } = viewportGridService.getState();
  const { element } = OHIFgetEnabledElement(activeViewportId) || {};
  const enabledElement = getEnabledElement(element);
  return enabledElement;
}
