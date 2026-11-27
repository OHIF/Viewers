export const reduce3DViewportSize = async (page: any) => {
  await page.evaluate(
    ({ cornerstone }: AppTypes.Test) => {
      // 'volume3d' is the current 3D viewport type and 'volume3dNext' the new one.
      const enabledElement = cornerstone
        .getEnabledElements()
        .filter(element => ['volume3d', 'volume3dNext'].includes(element.viewport.type))[0];
      const viewport = enabledElement.viewport as any;
      if (viewport.setZoom) {
        viewport.setZoom(0.5);
      } else {
        // The new 3D viewport has no setZoom. Doubling the parallel scale halves the zoom.
        const { parallelScale } = viewport.getViewState();
        viewport.setViewState({ parallelScale: parallelScale * 2 });
      }
      viewport.render();
    },
    await page.evaluateHandle('window')
  );
};
