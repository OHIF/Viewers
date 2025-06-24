type setVolumeViewportIndexType = {
  viewportId: string;
  index: number;
};

const setVolumeViewportIndex = async (page, viewportId, index) => {
  await page.evaluate(
    ({ services, viewportId, index }: withTestTypes<setVolumeViewportIndexType>) => {
      const { cornerstoneViewportService } = services;
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId) as any;
      viewport.setImageIdIndex(index);
    },
    { viewportId, index, services: await page.evaluateHandle('window.services') }
  );
};

export { setVolumeViewportIndex };
