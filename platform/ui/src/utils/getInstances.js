/**
 * Calculates the number of instances in series
 * @param {array} series
 * @returns {number} Number of instances in series
 */

const getInstances = series => {
  const instances = series.reduce((acc, item) => {
    return acc + item.instances.length;
  }, 0);

  return instances;
};

export default getInstances;
