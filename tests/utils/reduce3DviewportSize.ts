

import { CornerstoneType } from "../types";

export const reduce3DViewportSize = async (page: any) => {
  const cornerstone = await page.evaluateHandle('window.cornerstone');

  await page.evaluate((cornerstone: CornerstoneType) => {
    const enabledElement = cornerstone.getEnabledElements().filter(element => element.viewport.type === 'volume3d')[0]
    const { viewport } = enabledElement;
    viewport.setZoom(0.1);
    viewport.render()
  }, cornerstone);
}
