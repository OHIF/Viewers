import { Locator, Page } from '@playwright/test';

export async function clickAllElements(
  page: Page,
  query: (page: Page) => Promise<Locator[]>
)
{
  const items = await query(page);

  for (const item of items) {
    await item.click();
    await page.waitForTimeout(1000);
  }
}