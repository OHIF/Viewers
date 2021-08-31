import moment from 'moment';

export default function(searchData) {
  this.setState({ searchData });

  const filter = (key, searchData, study) => {
    if (key === 'studyDateFrom' && searchData[key] && study['StudyDate']) {
      const StudyDate = moment(study['StudyDate'], 'YYYYMMDD');
      return StudyDate.isBetween(
        searchData['studyDateFrom'],
        searchData['studyDateTo'],
        'days',
        '[]'
      );
    } else if (searchData[key] && !study[key].includes(searchData[key])) {
      return false;
    } else {
      return true;
    }
  };

  const { field, order } = searchData.sortData;

  // just a example of local filtering
  let filteredStudies = this.defaultStudies
    .filter(function(study) {
      const all = [
        'PatientName',
        'PatientID',
        'AccessionNumber',
        'modalities',
        'StudyDescription',
        'studyDateFrom',
      ].every(key => {
        return filter(key, searchData, study);
      });

      return all;
    })
    .sort(function(a, b) {
      if (order === 'desc') {
        if (a[field] < b[field]) {
          return -1;
        }
        if (a[field] > b[field]) {
          return 1;
        }
        return 0;
      } else {
        if (a[field] > b[field]) {
          return -1;
        }
        if (a[field] < b[field]) {
          return 1;
        }
        return 0;
      }
    });

  // User can notice the loading icon
  return new Promise(resolve => {
    setTimeout(() => {
      const first = searchData.currentPage * searchData.rowsPerPage;
      let last =
        searchData.currentPage * searchData.rowsPerPage +
        searchData.rowsPerPage;
      last = last >= filteredStudies.length ? filteredStudies.length : last;
      this.setState({ studies: filteredStudies.slice(first, last) });
      resolve();
    }, 500);
  });
}
