export default function checkUnmappedMeasurement(measurement): boolean{
  const { TrackingIdentifier } = measurement || {};
  const check1 = TrackingIdentifier === 'Lesion' &&
  measurement.coords.length === 1 &&
  measurement.coords[0].GraphicType === 'POLYLINE' &&
  measurement.coords[0].ValueType === 'SCOORD' &&
  Array.isArray(measurement.coords[0].GraphicData) &&
  measurement.coords[0].GraphicData.length % 2 === 0;

  const check2 = measurement.coords.length === 1 &&
  measurement.coords[0].GraphicType === 'POINT' &&
  measurement.coords[0].ValueType === 'SCOORD3D' &&
  Array.isArray(measurement.coords[0].GraphicData) &&
  measurement.coords[0].GraphicData.length === 3;

  return check1 || check2;
}
