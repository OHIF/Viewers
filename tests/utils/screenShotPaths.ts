/**
 * Paths to the screenshots of the tests.
 */
const screenShotPaths = {
  arrowAnnotate: {
    arrowAnnotateDisplayedCorrectly0: 'arrowAnnotateDisplayedCorrectly0.png',
    arrowAnnotateDisplayedCorrectly1: 'arrowAnnotateDisplayedCorrectly1.png',
    arrowAnnotateDisplayedCorrectly2: 'arrowAnnotateDisplayedCorrectly2.png',
  },
  angle: {
    angleDisplayedCorrectly: 'angleDisplayedCorrectly.png',
  },
  bidirectional: {
    bidirectionalDisplayedCorrectly: 'bidirectionalDisplayedCorrectly.png',
  },
  circle: {
    circleDisplayedCorrectly: 'circleDisplayedCorrectly.png',
  },
  cobbangle: {
    cobbangleDisplayedCorrectly: 'cobbangleDisplayedCorrectly.png',
  },
  contextMenu: {
    preContextMenuNearBottomEdge: 'preContextMenuNearBottomEdge.png',
    contextMenuNearBottomEdgeNotClipped: 'contextMenuNearBottomEdgeNotClipped.png',
  },
  ellipse: {
    ellipseDisplayedCorrectly: 'ellipseDisplayedCorrectly.png',
  },
  length: {
    lengthDisplayedCorrectly: 'lengthDisplayedCorrectly.png',
  },
  livewire: {
    livewireDisplayedCorrectly: 'livewireDisplayedCorrectly.png',
  },
  mpr: {
    mprDisplayedCorrectly: 'mprDisplayedCorrectly.png',
  },
  mpr2: {
    mprDisplayedCorrectly: 'mprDisplayedCorrectly.png',
    mprDisplayedCorrectlyZoomed: 'mprDisplayedCorrectlyZoomed.png',
  },
  threeDFourUp: {
    threeDFourUpDisplayedCorrectly: 'threeDFourUpDisplayedCorrectly.png',
  },
  threeDMain: {
    threeDMainDisplayedCorrectly: 'threeDMainDisplayedCorrectly.png',
  },
  threeDPrimary: {
    threeDPrimaryDisplayedCorrectly: 'threeDPrimaryDisplayedCorrectly.png',
  },
  threeDOnly: {
    threeDOnlyDisplayedCorrectly: 'threeDOnlyDisplayedCorrectly.png',
  },
  axialPrimary: {
    axialPrimaryDisplayedCorrectly: 'axialPrimaryDisplayedCorrectly.png',
  },
  probe: {
    probeDisplayedCorrectly: 'probeDisplayedCorrectly.png',
  },
  rectangle: {
    rectangleDisplayedCorrectly: 'rectangleDisplayedCorrectly.png',
  },
  spline: {
    splineDisplayedCorrectly: 'splineDisplayedCorrectly.png',
  },
  dicomTagBrowser: {
    dicomTagBrowserDisplayedCorrectly: 'dicomTagBrowserDisplayedCorrectly.png',
    scrollBarRenderedProperly: 'scrollBarRenderedProperly.png',
  },
  rotateRight: {
    rotateRightDisplayedCorrectly: 'rotateRightDisplayedCorrectly.png',
  },
  invert: {
    invertDisplayedCorrectly: 'invertDisplayedCorrectly.png',
  },
  flipHorizontal: {
    flipHorizontalDisplayedCorrectly: 'flipHorizontalDisplayedCorrectly.png',
  },
  reset: {
    resetDisplayedCorrectly: 'resetDisplayedCorrectly.png',
  },
  rtDataOverlayForUnreferencedDisplaySetNoHydration: {
    overlayFirstImage: 'overlayFirstImage.png',
    overlayMiddleImage: 'overlayMiddleImage.png',
  },
  rtDataOverlayNoHydrationThenMPR: {
    rtDataOverlayNoHydrationPreMPR: 'rtDataOverlayNoHydrationPreMpr.png',
    rtDataOverlayNoHydrationPostMPR: 'rtDataOverlayNoHydrationPostMpr.png',
  },
  rtHydrationFromMPR: {
    mprBeforeRT: 'mprBeforeRT.png',
    mprAfterRT: 'mprAfterRT.png',
    mprAfterRTHydrated: 'mprAfterRTHydrated.png',
    mprAfterRTHydratedAfterLayoutChange: 'mprAfterRTHydratedAfterLayoutChange.png',
  },
  rtHydrationThenMPR: {
    rtPostHydration: 'rtPostHydration.png',
    rtPostHydrationMPRAxialPrimary: 'rtPostHydrationMPRAxialPrimary.png',
  },
  rtNoHydrationThenMPR: {
    rtNoHydrationPreMPR: 'rtNoHydrationPreMpr.png',
    rtNoHydrationPostMPR: 'rtNoHydrationPostMpr.png',
  },
  srHydration: {
    srPostHydration: 'srPostHydration.png',
    srPreHydration: 'srPreHydration.png',
    srJumpToMeasurement: 'srJumpToMeasurement.png',
  },
  segHydration: {
    segPostHydration: 'segPostHydration.png',
    segPreHydration: 'segPreHydration.png',
    segJumpToSegment: 'segJumpToSegment.png',
  },
  segHydrationThenMPR: {
    segPostHydration: 'segPostHydration.png',
    segPostHydrationMPRAxialPrimary: 'segPostHydrationMPRAxialPrimary.png',
  },
  segHydrationFromMPR: {
    mprBeforeSEG: 'mprBeforeSEG.png',
    mprAfterSEG: 'mprAfterSEG.png',
    mprAfterSegHydrated: 'mprAfterSegHydrated.png',
    mprAfterSegHydratedAfterLayoutChange: 'mprAfterSegHydratedAfterLayoutChange.png',
  },
  segNoHydrationThenMPR: {
    segNoHydrationPreMPR: 'segNoHydrationPreMpr.png',
    segNoHydrationPostMPR: 'segNoHydrationPostMpr.png',
  },
  segDataOverlayForUnreferencedDisplaySetNoHydration: {
    overlayFirstImage: 'overlayFirstImage.png',
    overlayMiddleImage: 'overlayMiddleImage.png',
  },
  segDataOverlayNoHydrationThenMPR: {
    segDataOverlayNoHydrationPreMPR: 'segDataOverlayNoHydrationPreMpr.png',
    segDataOverlayNoHydrationPostMPR: 'segDataOverlayNoHydrationPostMpr.png',
  },
  mprThenRTOverlayNoHydration: {
    mprPreRTOverlayNoHydration: 'mprPreRTOverlayNoHydration.png',
    mprPostRTOverlayNoHydration: 'mprPostRTOverlayNoHydration.png',
  },
  mprThenSEGOverlayNoHydration: {
    mprPreSEGOverlayNoHydration: 'mprPreSEGOverlayNoHydration.png',
    mprPostSEGOverlayNoHydration: 'mprPostSEGOverlayNoHydration.png',
  },
  rtHydration: {
    rtPostHydration: 'rtPostHydration.png',
    rtPreHydration: 'rtPreHydration.png',
    rtJumpToStructure: 'rtJumpToStructure.png',
  },
  rtHydration2: {
    rtPostHydration: 'rtPostHydration.png',
    rtPreHydration: 'rtPreHydration.png',
  },
  crosshairs: {
    crosshairsRendered: 'crosshairsRendered.png',
    crosshairsRotated: 'crosshairsRotated.png',
    crosshairsSlabThickness: 'crosshairsSlabThickness.png',
    crosshairsResetToolbar: 'crosshairsResetToolbar.png',
    crosshairsNewDisplayset: 'crosshairsNewDisplayset.png',
  },
  tmtvRendering: {
    tmtvDisplayedCorrectly: 'tmtvDisplayedCorrectly.png',
  },
  jumpToMeasurementMPR: {
    initialDraw: 'jumpToMeasurementMPR-initialDraw.png',
    scrollAway: 'jumpToMeasurementMPR-scrollAway.png',
    jumpToMeasurementStack: 'jumpToMeasurementMPR-jumpToMeasurementStack.png',
    goToMPR: 'jumpToMeasurementMPR-goToMPR.png',
    jumpInMPR: 'jumpToMeasurementMPR-jumpInMPR.png',
    changeSeriesInMPR: 'jumpToMeasurementMPR-changeSeriesInMPR.png',
    jumpToMeasurementAfterSeriesChange:
      'jumpToMeasurementMPR-jumpToMeasurementAfterSeriesChange.png',
  },
  dataOverlayMenu: {
    overlayMenuWithSegmentationSelected: 'overlayMenuWithSegmentationSelected.png',
    overlayMenuWith2d_tta_nnU_Net_SegmentationSelected:
      'overlayMenuWith2d_tta_nnU_Net_SegmentationSelected.png',
    overlayMenuWithSegmentationOverlaysRemoved: 'overlayMenuWithSegmentationOverlaysRemoved.png',
    overlay2d_tta_nnU_Net_Segmentation: 'overlay2d_tta_nnU_Net_Segmentation.png',
    overlaySegmentation: 'overlaySegmentation.png',
    noOverlay: 'noOverlay.png',
  },
  multipleSegmentationDataOverlays: {
    threeSegOverlaysInOverlayMenu: 'threeSegOverlaysInOverlayMenu.png',
    overlaysDisplayed: 'overlaysDisplayed.png',
    overlaySEGsAndRTDisplayed: 'overlaySEGsAndRTDisplayed.png',
  },
  workList: {
    scrollBarRenderedProperly: 'scrollBarRenderedProperly.png',
  },
};

export { screenShotPaths };
