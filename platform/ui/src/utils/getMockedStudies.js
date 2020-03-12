import studyListMock from '../mocks/studyList.json';

/** Values can be env vars */
const DEFAULT_MOCKED_STUDIES_NUM = 50;
const DEFAULT_MOCKED_STUDIES_LIMIT = 1000;

const getMockedStudies = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const generateData = num => new Array(+num).fill(studyListMock.studies[0]);
  const getStudiesNum = num =>
    +num > DEFAULT_MOCKED_STUDIES_LIMIT ? DEFAULT_MOCKED_STUDIES_LIMIT : +num;
  const defaultStudiesNum = getStudiesNum(DEFAULT_MOCKED_STUDIES_NUM);

  if (!urlParams) {
    return generateData(defaultStudiesNum);
  }

  const studiesNum =
    getStudiesNum(urlParams.get('studiesNum')) || defaultStudiesNum;

  return generateData(studiesNum);
};

export default getMockedStudies;
