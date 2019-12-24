export default function(measurement) {
  if (!measurement) {
    return;
  }

  switch (measurement.toolType) {
    case 'Bidirectional':
    case 'TargetCR':
    case 'TargetNE':
    case 'TargetUN':
      return `Target ${measurement.lesionNamingNumber}`;
    case 'NonTarget':
      return `Non-Target ${measurement.lesionNamingNumber}`;
  }
}
