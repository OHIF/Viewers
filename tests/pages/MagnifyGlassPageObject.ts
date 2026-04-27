import { Locator, Page } from '@playwright/test';
import { simulateNormalizedDragOnElement } from '../utils';

type MagnifyDragParams = {
  start: { x: number; y: number };
  end?: { x: number; y: number };
  mouseUp?: boolean;
  button?: 'left' | 'right' | 'middle';
  delay?: number;
  steps?: number;
};

export class MagnifyGlassPageObject {
  readonly page: Page;
  readonly viewport: Locator;

  constructor(page: Page, viewport: Locator) {
    this.page = page;
    this.viewport = viewport;
  }

  get locator(): Locator {
    return this.page.locator('.magnifyTool');
  }

  async drag({
    start,
    end,
    button,
    delay,
    steps,
    mouseUp = true,
  }: MagnifyDragParams): Promise<void> {
    await simulateNormalizedDragOnElement({
      locator: this.viewport,
      start,
      end: end ?? start,
      button,
      delay,
      steps,
      mouseUp,
    });
  }

  async stopDrag(): Promise<void> {
    await this.page.mouse.up();
  }
}
