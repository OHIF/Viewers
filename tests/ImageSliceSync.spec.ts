import { expect, test, visitStudy, waitForViewportsRendered } from './utils';

// Two reconstructable CT series on this study, also used by Crosshairs.spec.ts.
const SERIES_A = 'PRE LIVER';
const SERIES_B = 'Recon 3: LIVER 3 PHASE (AP)';

// Large enough that the synchronized viewport lands on a different slice even
// when the two series have different slice spacing.
const SCROLL_DELTA = 10;

test.beforeEach(async ({ page }) => {
  const studyInstanceUID = '1.3.6.1.4.1.14519.5.2.1.1706.8374.643249677828306008300337414785';
  const mode = 'viewer';
  await visitStudy(page, studyInstanceUID, mode, 2000);
});

test.describe('Image Slice Sync', async () => {
  // Regression test for #6199: the first viewport never remounts across a manual
  // layout change, so replacing its display set used to drop it from the sync group.
  test('should keep synchronizing after the series in the first viewport is replaced', async ({
    page,
    leftPanelPageObject,
    mainToolbarPageObject,
    viewportPageObject,
  }) => {
    // Put a known series in each viewport under test, so the result does not
    // depend on thumbnail ordering or hanging protocol fill order.
    const loadIntoViewport = async (index: number, description: string) => {
      await viewportPageObject.getNthLocator(index).click();
      await expect(viewportPageObject.getNthLocator(index)).toHaveAttribute(
        'data-is-active',
        'true'
      );
      // The series load already puts a render in flight, so wait for the
      // viewports to report rendered rather than for a full needsRender cycle.
      await leftPanelPageObject.loadSeriesByDescription(description);
      await waitForViewportsRendered(page);
    };

    await mainToolbarPageObject.layoutSelection.grid(2, 2).click();
    await expect(viewportPageObject.getNthLocator(3)).toBeVisible();
    await waitForViewportsRendered(page);

    await loadIntoViewport(0, SERIES_B);
    await loadIntoViewport(1, SERIES_A);

    await mainToolbarPageObject.moreTools.imageSliceSync.click();

    const firstViewport = await viewportPageObject.getNth(0);
    const secondViewport = await viewportPageObject.getNth(1);
    const firstInstanceNumber = firstViewport.overlayText.bottomRight.instanceNumber;
    const secondInstanceNumber = secondViewport.overlayText.bottomRight.instanceNumber;

    await expect(firstInstanceNumber).toBeVisible();
    await expect(secondInstanceNumber).toBeVisible();

    // Scroll one viewport and assert the other one followed. This is the actual
    // user-visible effect of the sync, not a proxy for it.
    const expectSyncFrom = async (
      source: typeof firstViewport,
      follower: typeof secondInstanceNumber
    ) => {
      const before = (await follower.textContent()) ?? '';
      // Guard against a vacuous pass: an empty starting value would make the
      // "changed" assertion below true no matter what the synchronizer did.
      expect(before).not.toBe('');
      await source.sliceNavigation.scrollBy(SCROLL_DELTA);
      await expect(follower).not.toHaveText(before);
    };

    // Baseline: sync is working before the series is replaced.
    await expectSyncFrom(firstViewport, secondInstanceNumber);

    // Replace the series in the FIRST viewport. This is the step that used to
    // break synchronization.
    await loadIntoViewport(0, SERIES_A);

    // Must still drive the second viewport and still follow it: it is registered
    // as both source and target, and was dropped from both roles.
    await expectSyncFrom(firstViewport, secondInstanceNumber);
    await expectSyncFrom(secondViewport, firstInstanceNumber);
  });
});
