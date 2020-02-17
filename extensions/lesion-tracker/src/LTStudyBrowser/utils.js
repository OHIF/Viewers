import moment from 'moment';

const formatDate = date => {
  return moment(date).format('DD-MMM-YY');
};

const getModalities = (series = []) => {
  const modalities = [];
  series.forEach(_series => {
    if (!modalities.includes(_series.modality)) {
      modalities.push(_series.modality);
    }
  });

  return modalities.join(',');
};

const getStudyData = (study = {}) => {
  return {
    studyDate: formatDate(study.studyDate),
    studyDescription: study.studyDescription || ' ',
    modalities: getModalities(study.seriesList),
    studyAvailable: study.studyAvailable,
  };
};

export { formatDate, getStudyData, getModalities };
