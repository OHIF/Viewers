import { IEnabledElement } from '@cornerstonejs/core/types';

import { getViewportEnabledElement } from './getViewportEnabledElement';

export default function getActiveViewportEnabledElement(viewportGridService): IEnabledElement {
  const { activeViewportId } = viewportGridService.getState();
  return getViewportEnabledElement(activeViewportId);
}
