import { metaData } from '@cornerstonejs/core';

import FanShapeGeometryProvider from '../providers/FanShapeGeometryProvider';

export default function init({ servicesManager }) {
  const fanShapeGeometryProvider = new FanShapeGeometryProvider(servicesManager.services);
  metaData.addProvider(fanShapeGeometryProvider.get.bind(fanShapeGeometryProvider), 9999);
}
