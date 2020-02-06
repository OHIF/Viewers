import exportPDF from './exportPDF';

const generateReport = (event, instance) => {
  const { measurementApi, timepointApi } = instance.data;
  exportPDF(measurementApi, timepointApi);
};

export { generateReport };
