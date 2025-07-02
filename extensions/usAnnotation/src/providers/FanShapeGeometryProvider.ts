import getInstanceByImageId from '../getInstanceByImageId';

class FanShapeGeometryProvider {
  services;
  constructor(services) {
    this.services = services;
  }
  get(query, imageId) {
    if (query !== 'ultrasoundFanShapeGeometry') {
      return null;
    }
    const instance = getInstanceByImageId(this.services, imageId);
    // here you can add your logic to retrieve the fan shape geometry
    // based on the instance or imageId
    // The value returned should be an object with the following structure:
    // return {
    //   center: Types.Point2; // The center of the fan shape in pixel coordinates (e.g. [-70, 80])
    //   startAngle: number; // The starting angle of the fan shape in degrees (e.g. 60)
    //   endAngle: number; // The ending angle of the fan shape in degrees (e.g. 120)
    //   innerRadius: number; // The inner radius of the fan shape (e.g. 300)
    //   outerRadius: number; // The outer radius of the fan shape (e.g. 650)
    // };

    return null;
  }
}

export default FanShapeGeometryProvider;
