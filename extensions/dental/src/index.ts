import { Types } from '@ohif/core';

import getLayoutTemplateModule from './getLayoutTemplateModule';
import { id } from './id';

const dentalExtension: Types.Extensions.Extension = {
  id,
  getLayoutTemplateModule,
};

export default dentalExtension;
