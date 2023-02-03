import MeasurementService from './MeasurementService';

const MeasurementServiceRegistration = {
  name: 'measurementService',
  altName: 'MeasurementService',
  create: ({ configuration = {} }) => {
    return new MeasurementService();
  },
};

export { MeasurementService, MeasurementServiceRegistration };
