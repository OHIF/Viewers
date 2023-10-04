import studyListMock from '../mocks/studyList';

/** Values can be env vars */
const DEFAULT_MOCKED_STUDIES_LIMIT = 1000;

/**
 * Method to get a mocked study list
 * @param {number} items Number of studies to be loaded
 * @returns {array} Study list
 */
const getMockedStudies = (items = 50) => {
  const num = items > DEFAULT_MOCKED_STUDIES_LIMIT ? DEFAULT_MOCKED_STUDIES_LIMIT : items;
  return new Array(num).fill(studyListMock.studies[0]);
};

export default getMockedStudies;
