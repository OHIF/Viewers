import { test, expect } from 'playwright-test-coverage';
import { visitStudy, scrollVolumeViewport } from './utils';

test.skip('PT should show slice closest to CT', async ({ page }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'tmtv';
  await visitStudy(page, studyInstanceUID, mode);

  const vp = page.getByTestId('viewport-pane');

  // Sagittal
  await expect(vp.nth(1)).toContainText('257/512', { useInnerText: true }); // Should default i 257
  await expect.soft(vp.nth(4)).toContainText('97/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 256
  await expect(vp.nth(1)).toContainText('256/512');
  await expect.soft(vp.nth(4)).toContainText('96/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 255
  await expect(vp.nth(1)).toContainText('255/512');
  await expect.soft(vp.nth(4)).toContainText('95/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 254
  await expect(vp.nth(1)).toContainText('254/512');
  await expect.soft(vp.nth(4)).toContainText('95/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 253
  await expect(vp.nth(1)).toContainText('253/512');
  await expect.soft(vp.nth(4)).toContainText('94/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 252
  await expect(vp.nth(1)).toContainText('252/512');
  await expect.soft(vp.nth(4)).toContainText('94/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 251
  await expect(vp.nth(1)).toContainText('251/512');
  await expect.soft(vp.nth(4)).toContainText('93/192');

  // Coronal
  await expect(vp.nth(2)).toContainText('256/512'); // Should default i 256
  await expect.soft(vp.nth(5)).toContainText('96/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 255
  await expect(vp.nth(2)).toContainText('255/512');
  await expect.soft(vp.nth(5)).toContainText('96/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 254
  await expect(vp.nth(2)).toContainText('254/512');
  await expect.soft(vp.nth(5)).toContainText('95/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 253
  await expect(vp.nth(2)).toContainText('253/512');
  await expect.soft(vp.nth(5)).toContainText('95/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 252
  await expect(vp.nth(2)).toContainText('252/512');
  await expect.soft(vp.nth(5)).toContainText('94/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 251
  await expect(vp.nth(2)).toContainText('251/512');
  await expect.soft(vp.nth(5)).toContainText('94/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 250
  await expect(vp.nth(2)).toContainText('250/512');
  await expect.soft(vp.nth(5)).toContainText('93/192');
});
