import './dental-theme.css';

import { Types } from '@ohif/core';
import getHangingProtocolModule from './getHangingProtocolModule';

export { default as PracticeHeader } from './components/PracticeHeader';
export { default as ToothSelector } from './components/ToothSelector';
export { default as DentalViewerHeader } from './components/DentalViewerHeader';

const dentalHeaderExtension: Types.Extensions.Extension = {
  id: 'dental-header',
  getHangingProtocolModule,
};

export default dentalHeaderExtension;
