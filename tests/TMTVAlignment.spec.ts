import { expect, scrollVolumeViewport, test, visitStudy } from './utils';

test.skip('PT should show slice closest to CT', async ({ page, viewportPageObject }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'tmtv';
  await visitStudy(page, studyInstanceUID, mode);

  const viewport1 = await viewportPageObject.getNth(1);
  const viewport2 = await viewportPageObject.getNth(2);
  const viewport4 = await viewportPageObject.getNth(4);
  const viewport5 = await viewportPageObject.getNth(5);

  // Sagittal
  await expect(viewport1.pane).toContainText('257/512', {
    useInnerText: true,
  }); // Should default i 257
  await expect.soft(viewport4.pane).toContainText('97/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 256
  await expect(viewport1.pane).toContainText('256/512');
  await expect.soft(viewport4.pane).toContainText('96/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 255
  await expect(viewport1.pane).toContainText('255/512');
  await expect.soft(viewport4.pane).toContainText('95/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 254
  await expect(viewport1.pane).toContainText('254/512');
  await expect.soft(viewport4.pane).toContainText('95/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 253
  await expect(viewport1.pane).toContainText('253/512');
  await expect.soft(viewport4.pane).toContainText('94/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 252
  await expect(viewport1.pane).toContainText('252/512');
  await expect.soft(viewport4.pane).toContainText('94/192');
  await scrollVolumeViewport(page, 'ctSAGITTAL', -1); // CT i 251
  await expect(viewport1.pane).toContainText('251/512');
  await expect.soft(viewport4.pane).toContainText('93/192');

  // Coronal
  await expect(viewport2.pane).toContainText('256/512'); // Should default i 256
  await expect.soft(viewport5.pane).toContainText('96/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 255
  await expect(viewport2.pane).toContainText('255/512');
  await expect.soft(viewport5.pane).toContainText('96/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 254
  await expect(viewport2.pane).toContainText('254/512');
  await expect.soft(viewport5.pane).toContainText('95/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 253
  await expect(viewport2.pane).toContainText('253/512');
  await expect.soft(viewport5.pane).toContainText('95/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 252
  await expect(viewport2.pane).toContainText('252/512');
  await expect.soft(viewport5.pane).toContainText('94/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 251
  await expect(viewport2.pane).toContainText('251/512');
  await expect.soft(viewport5.pane).toContainText('94/192');
  await scrollVolumeViewport(page, 'ctCORONAL', -1); // CT i 250
  await expect(viewport2.pane).toContainText('250/512');
  await expect.soft(viewport5.pane).toContainText('93/192');
});
