import React from 'react';
import { WindowLevelActionMenuWrapper } from './WindowLevelActionMenuWrapper';

export function getWindowLevelActionMenu(
  props: withAppTypes<{
    viewportId: string;
    element: HTMLElement;
    location: string;
    displaySets: Array<any>;
  }>
) {
  return <WindowLevelActionMenuWrapper {...props} />;
}
