export const subscribeToMeasurementAdded = async (page: any) => {
  await page.evaluate(
    ({ services }: AppTypes.Test) => {
      const { measurementService } = services;

      window.__measurementAddedFired = false;

      const { unsubscribe } = measurementService.subscribe(
        measurementService.EVENTS.MEASUREMENT_ADDED,
        () => {
          window.__measurementAddedFired = true;
        }
      );

      window.__unsubscribeMeasurementAdded = unsubscribe;
    },
    await page.evaluateHandle('window')
  );

  return {
    getFired: async () => page.evaluate(() => window.__measurementAddedFired === true),

    unsubscribe: async () => {
      await page.evaluate(() => {
        const unsub = window.__unsubscribeMeasurementAdded;
        unsub?.();
      });
    },
  };
};
