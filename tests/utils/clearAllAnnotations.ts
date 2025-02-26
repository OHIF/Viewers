const clearAllAnnotations = async page => {
  await page.evaluate(
    ({ cornerstoneTools }: AppTypes.Test) => {
      cornerstoneTools.annotation.state.removeAllAnnotations();
    },
    await page.evaluateHandle('window')
  );
};

export { clearAllAnnotations };
