const formatPatientName = context => {
  if (!context || typeof context !== 'string') {
    return;
  }

  return context.replace('^', ', ');
};

const getLocationLabel = measurement => {
  return measurement.location || measurement.label || '';
};

export { formatPatientName, getLocationLabel };
