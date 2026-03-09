export const subscribeToMeasurementAdded = async (page: any) => {
  let measurementAddedFired = false;
  let unsubscribeMeasurementAdded: () => void;

  await page.evaluate(
    ({ services }: AppTypes.Test) => {
      const { measurementService } = services;

      const { unsubscribe } = measurementService.subscribe(
        measurementService.EVENTS.MEASUREMENT_ADDED,
        () => {
          measurementAddedFired = true;
        }
      );

      unsubscribeMeasurementAdded = unsubscribe;
    },
    await page.evaluateHandle('window')
  );

  return {
    waitFired: async (timeout?: number) =>
      await page.waitForFunction(
        () => measurementAddedFired === true,
        timeout != null ? { timeout } : undefined
      ),

    unsubscribe: async () => {
      await page.evaluate(() => {
        unsubscribeMeasurementAdded?.();
      });
    },
  };
};
