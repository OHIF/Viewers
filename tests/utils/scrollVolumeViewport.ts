type scrollVolumeViewportType = {
  viewportId: string;
  delta: number;
};

const scrollVolumeViewport = async (page, viewportId, delta) => {
  await page.evaluate(
    ({ services, viewportId, delta }: withTestTypes<scrollVolumeViewportType>) => {
      const { cornerstoneViewportService } = services;
      const viewport = cornerstoneViewportService.getCornerstoneViewport(viewportId) as any;
      viewport.scroll(delta);
    },
    { viewportId, delta, services: await page.evaluateHandle('window.services') }
  );
};

export { scrollVolumeViewport };
