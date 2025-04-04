function createSeriesMetadata(SeriesInstanceUID) {
  const instances = [];
  const instancesMap = new Map();

  return {
    SeriesInstanceUID,
    instances,
    addInstance: function (newInstance) {
      this.addInstances([newInstance]);
    },
    addInstances: function (newInstances) {
      for (let i = 0, len = newInstances.length; i < len; i++) {
        const instance = newInstances[i];

        if (!instancesMap.has(instance.SOPInstanceUID)) {
          instancesMap.set(instance.SOPInstanceUID, instance);
          instances.push(instance);
        }
      }
    },
    getInstance: function (SOPInstanceUID) {
      return instancesMap.get(SOPInstanceUID);
    },
  };
}

export default createSeriesMetadata;
