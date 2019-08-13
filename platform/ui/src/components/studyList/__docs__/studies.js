import moment from 'moment';

const studies = [
  {
    studyInstanceUid: '11111.111111.111111.11111',
    patientName: 'John Doe',
    patientId: '1',
    accessionNumber: '1234567',
    studyDate: '19930201',
    modalities: 'MR',
    studyDescription: 'BRAIN',
  },
  {
    studyInstanceUid: '2222.222222.22222.22222',
    patientName: 'José Silva',
    patientId: '2',
    accessionNumber: '7654321',
    studyDate: moment().format('YYYYMMDD'),
    modalities: 'CT',
    studyDescription: 'PET CT STANDARD',
  },
  {
    studyInstanceUid: '3333.333333.33333.33333',
    patientName: 'Antônio Jefferson',
    patientId: '3',
    accessionNumber: '732311',
    studyDate: moment()
      .subtract(14, 'days')
      .format('YYYYMMDD'),
    modalities: 'US',
    studyDescription: '0',
  },
  {
    studyInstanceUid: '444444.44444.44444.4444',
    patientName: 'Antonio da Silva',
    patientId: '4',
    accessionNumber: '732311',
    studyDate: moment()
      .subtract(1, 'months')
      .format('YYYYMMDD'),
    modalities: 'US',
    studyDescription: '0',
  },
  {
    studyInstanceUid: '55555.55555.55555.55555',
    patientName: 'Bezerra Souza',
    patientId: '5',
    accessionNumber: '5134543',
    studyDate: moment()
      .subtract(6, 'days')
      .format('YYYYMMDD'),
    modalities: 'US',
    studyDescription: '0',
  },
  {
    studyInstanceUid: '66666.66666.66666.6666',
    patientName: 'Geraldo Roger',
    patientId: '6',
    accessionNumber: '5315135',
    studyDate: moment()
      .subtract(7, 'days')
      .format('YYYYMMDD'),
    modalities: 'US',
    studyDescription: 'US',
  },
  {
    studyInstanceUid: '77777.77777.77777.77777',
    patientName: '',
    patientId: '7',
    accessionNumber: '5315136',
    studyDate: moment()
      .subtract(5, 'days')
      .format('YYYYMMDD'),
    modalities: 'US',
    studyDescription: 'US',
  },
].sort(function(a, b) {
  if (a.patientName < b.patientName) {
    return -1;
  }
  if (a.patientName > b.patientName) {
    return 1;
  }
  return 0;
});

export default studies;
