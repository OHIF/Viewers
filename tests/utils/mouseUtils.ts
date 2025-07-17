import { Page } from 'playwright-test-coverage';

interface WindowWithMousePosition extends Window {
  mouseX: number;
  mouseY: number;
}

export const initializeMousePositionTracker = async (page: Page) => {
  const window = (await page.evaluateHandle('window')) as any;
  await page.evaluate((window: WindowWithMousePosition) => {
    window.mouseX = 0;
    window.mouseY = 0;
    window.addEventListener('mousemove', event => {
      window.mouseX = event.clientX;
      window.mouseY = event.clientY;
    });
  }, window);
};

export const getMousePosition = async (page: Page) => {
  const window = (await page.evaluateHandle('window')) as any;
  return await page.evaluate((window: WindowWithMousePosition) => {
    return { x: window.mouseX, y: window.mouseY };
  }, window);
};
