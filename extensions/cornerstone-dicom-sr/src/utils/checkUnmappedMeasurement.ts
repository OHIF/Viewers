export default function checkUnmappedMeasurement(measurement): boolean{
  const { TrackingIdentifier } = measurement || {};
  return TrackingIdentifier === 'Lesion' &&
  measurement.coords.length === 1 &&
  measurement.coords[0].GraphicType === 'POLYLINE' &&
  measurement.coords[0].ValueType === 'SCOORD' &&
  Array.isArray(measurement.coords[0].GraphicData) &&
  measurement.coords[0].GraphicData.length % 2 === 0;
}
