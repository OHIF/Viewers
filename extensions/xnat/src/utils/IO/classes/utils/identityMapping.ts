// Identity mapping that extracts the measurement from the annotation wrapper
export const identityMapping = data => {
  // The data object contains the annotation wrapper, we need to extract the actual measurement
  if (data.annotation && data.measurement) {
    return data.measurement;
  }
  return data;
}; 