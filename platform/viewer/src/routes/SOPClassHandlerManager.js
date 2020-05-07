export default class SOPClassHandlerManager {
  constructor(sopClassHandlerIds) {
    this.SOPClassHandlers = sopClassHandlerIds.map(getSOPClassHandler);
  }

  async createDisplaySets() {
    const SOPClassHandlers = this.SOPClassHandlers;

    const displaySets = [];

    // TODO
    StudyMetadata.forEachSeries(series => {
      for (let i = 0; i < SOPClassHandlers.length; i++) {
        const handler = SOPClassHandlers[i];

        // TODO: This step is still unclear to me
        const displaySet = handler(series);

        if (displaySet) {
          displaySets.push(displaySet);
        }
      }
    });

    return displaySets;
  }
}
