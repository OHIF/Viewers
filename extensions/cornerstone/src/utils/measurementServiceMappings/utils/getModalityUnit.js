function getModalityUnit(modality) {
  if (modality === 'CT') {
    return 'HU';
  } else if (modality === 'PT') {
    return 'SUV';
  } else {
    return '';
  }
}

export default getModalityUnit;
