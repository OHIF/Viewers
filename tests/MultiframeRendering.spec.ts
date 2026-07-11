import {
  test,
  expect,
  visitStudy,
  getViewportCanvasStats,
  waitForViewportsRendered,
  waitForViewportRenderCycle,
} from './utils';

// Ultrasound cine study: one series, nine instances, all but one multiframe.
// The first display set is the InstanceNumber=1 instance with 94 frames.
const usMultiframeStudyUID = '1.2.840.113663.1500.1.248223208.1.1.20110323.105903.687';

// NM brain SPECT study: one series of five multiframe instances whose per-frame
// positions come from DetectorInformationSequence rather than per-frame groups.
const nmMultiframeStudyUID = '1.2.276.0.7230010.3.1.2.447481088.1.1669202398.851612';

// A rendered frame must have some visible content; cine/SPECT frames are mostly
// dark background, so the bar is intentionally low. A blank or black viewport
// scores 0.
const minimumNonBlackRatio = 0.01;

test.describe('Multiframe ultrasound rendering', () => {
  test.beforeEach(async ({ page }) => {
    await visitStudy(page, usMultiframeStudyUID, 'viewer', 2000);
    await waitForViewportsRendered(page);
  });

  test('should render a multiframe instance as a stack of all its frames', async ({
    page,
    viewportPageObject,
  }) => {
    const activeViewport = await viewportPageObject.active;

    // All 94 frames of the instance must be enumerated as the stack size.
    await expect(activeViewport.overlayText.bottomRight.instanceNumber).toContainText('(1/94)', {
      timeout: 10000,
    });

    // The first frame must actually be painted, not a blank/black canvas.
    const stats = await getViewportCanvasStats({ page });
    expect(stats.nonBlackRatio).toBeGreaterThan(minimumNonBlackRatio);
  });

  test('should render distinct content when navigating through frames', async ({
    page,
    viewportPageObject,
  }) => {
    const activeViewport = await viewportPageObject.active;
    await expect(activeViewport.overlayText.bottomRight.instanceNumber).toContainText('(1/94)', {
      timeout: 10000,
    });
    const firstFrameStats = await getViewportCanvasStats({ page });
    expect(firstFrameStats.nonBlackRatio).toBeGreaterThan(minimumNonBlackRatio);

    // Advance one frame: the overlay must track the frame index and the canvas
    // must not go black (a past regression rendered black from the 2nd frame on).
    let renderCycle = waitForViewportRenderCycle(page);
    await activeViewport.sliceNavigation.scrollBy(1);
    await renderCycle;

    await expect(activeViewport.overlayText.bottomRight.instanceNumber).toContainText('(2/94)');
    const secondFrameStats = await getViewportCanvasStats({ page });
    expect(secondFrameStats.nonBlackRatio).toBeGreaterThan(minimumNonBlackRatio);

    // Jump to the last frame: the canvas content must differ from frame 1,
    // which fails if the stack is stuck rendering the first frame.
    renderCycle = waitForViewportRenderCycle(page);
    await activeViewport.sliceNavigation.toLastSlice();
    await renderCycle;

    await expect(activeViewport.overlayText.bottomRight.instanceNumber).toContainText('(94/94)');
    const lastFrameStats = await getViewportCanvasStats({ page });
    expect(lastFrameStats.nonBlackRatio).toBeGreaterThan(minimumNonBlackRatio);
    expect(lastFrameStats.digest).not.toBe(firstFrameStats.digest);
  });
});

test.describe('Multiframe NM rendering', () => {
  test.beforeEach(async ({ page }) => {
    await visitStudy(page, nmMultiframeStudyUID, 'viewer', 2000);
    await waitForViewportsRendered(page);
  });

  test('should render a multiframe NM instance with all frames enumerated', async ({
    page,
    viewportPageObject,
  }) => {
    const activeViewport = await viewportPageObject.active;
    const instanceNumberOverlay = activeViewport.overlayText.bottomRight.instanceNumber;

    await expect(instanceNumberOverlay).toContainText('(1/', { timeout: 10000 });

    // The stack size shown by the overlay must be the instance's frame count,
    // not 1 (which is what a broken multiframe split would produce).
    const overlayText = await instanceNumberOverlay.textContent();
    const stackSize = Number(overlayText.match(/\(1\/(\d+)\)/)?.[1]);
    expect(stackSize).toBeGreaterThan(1);

    const stats = await getViewportCanvasStats({ page });
    expect(stats.nonBlackRatio).toBeGreaterThan(minimumNonBlackRatio);
  });
});
