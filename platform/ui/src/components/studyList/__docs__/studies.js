import moment from 'moment';

const studies = [
  {
    StudyInstanceUID: '11111.111111.111111.11111',
    PatientName: 'John Doe',
    PatientID: '1',
    AccessionNumber: '1234567',
    StudyDate: '19930201',
    modalities: 'MR',
    StudyDescription: 'BRAIN',
  },
  {
    StudyInstanceUID: '2222.222222.22222.22222',
    PatientName: 'José Silva',
    PatientID: '2',
    AccessionNumber: '7654321',
    StudyDate: moment().format('YYYYMMDD'),
    modalities: 'CT',
    StudyDescription: 'PET CT STANDARD',
  },
  {
    StudyInstanceUID: '3333.333333.33333.33333',
    PatientName: 'Antônio Jefferson',
    PatientID: '3',
    AccessionNumber: '732311',
    StudyDate: moment()
      .subtract(14, 'days')
      .format('YYYYMMDD'),
    modalities: 'US',
    StudyDescription: '0',
  },
  {
    StudyInstanceUID: '444444.44444.44444.4444',
    PatientName: 'Antonio da Silva',
    PatientID: '4',
    AccessionNumber: '732311',
    StudyDate: moment()
      .subtract(1, 'months')
      .format('YYYYMMDD'),
    modalities: 'US',
    StudyDescription: '0',
  },
  {
    StudyInstanceUID: '55555.55555.55555.55555',
    PatientName: 'Bezerra Souza',
    PatientID: '5',
    AccessionNumber: '5134543',
    StudyDate: moment()
      .subtract(6, 'days')
      .format('YYYYMMDD'),
    modalities: 'US',
    StudyDescription: '0',
  },
  {
    StudyInstanceUID: '66666.66666.66666.6666',
    PatientName: 'Geraldo Roger',
    PatientID: '6',
    AccessionNumber: '5315135',
    StudyDate: moment()
      .subtract(7, 'days')
      .format('YYYYMMDD'),
    modalities: 'US',
    StudyDescription: 'US',
  },
  {
    StudyInstanceUID: '77777.77777.77777.77777',
    PatientName: '',
    PatientID: '7',
    AccessionNumber: '5315136',
    StudyDate: moment()
      .subtract(5, 'days')
      .format('YYYYMMDD'),
    modalities: 'US',
    StudyDescription: 'US',
  },
].sort(function(a, b) {
  if (a.PatientName < b.PatientName) {
    return -1;
  }
  if (a.PatientName > b.PatientName) {
    return 1;
  }
  return 0;
});

export default studies;
