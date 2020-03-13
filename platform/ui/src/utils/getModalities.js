/**
 * Get formatted Modalities
 * @param {array} series
 * @returns {string} Formatted modalities
 */
const getModalities = series => {
  const modalities = series.reduce((acc, item) => {
    const { Modality } = item;
    if (acc.includes(Modality)) {
      return acc;
    }

    acc.push(Modality);
    return acc;
  }, []);

  return modalities.join('/');
};

export default getModalities;
