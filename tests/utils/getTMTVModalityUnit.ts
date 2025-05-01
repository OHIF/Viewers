const getTMTVModalityUnit = async (page, attempts = 20) => {
  for (let i = 0; i < attempts; i++) {
    try {
      const modalityUnit = await page.evaluate(
        ({ cornerstoneTools }: AppTypes.Test) => {
          const annotations = cornerstoneTools.annotation.state.getAllAnnotations();
          const stats = annotations[0].data.cachedStats;
          const targetIds = Object.keys(stats);
          const targetStats = stats[targetIds[1]];
          return targetStats.modalityUnit;
        },
        await page.evaluateHandle('window')
      );

      if (modalityUnit) {
        return modalityUnit;
      }
    } catch (error) {
      console.error('Failed to get modalityUnit', error);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Failed to get modalityUnit after multiple attempts');
};

export { getTMTVModalityUnit };
