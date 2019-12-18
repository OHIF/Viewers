import MeasurementService from './MeasurementService';

export default {
  name: 'MeasurementService',
  create: ({ configuration = {} }) => {
    return new MeasurementService();
  },
};
