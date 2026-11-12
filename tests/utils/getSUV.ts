const getSUV = async page => {
  const SUV = await page.evaluate(
    ({ services }: AppTypes.Test) => {
      const { measurementService } = services;
      const measurements = measurementService.getMeasurements();
      const displayText = measurements[0].displayText;
      return displayText[2];
    },
    await page.evaluateHandle('window')
  );

  return SUV;
};

export { getSUV };
