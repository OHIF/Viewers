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
    return null;
  }
}

export default FanShapeGeometryProvider;
