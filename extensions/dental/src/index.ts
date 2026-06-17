import { Types } from '@ohif/core';

import getLayoutTemplateModule from './getLayoutTemplateModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import sameAttributeAsDisplaySet from './customAttributes/sameAttributeAsDisplaySet';
import { id } from './id';

const dentalExtension: Types.Extensions.Extension = {
  id,
  preRegistration: ({ servicesManager }: Types.Extensions.ExtensionParams) => {
    const { hangingProtocolService } = servicesManager.services;

    hangingProtocolService.addCustomAttribute(
      'sameAttributeAsDisplaySet',
      'Match an attribute on an already selected display set',
      sameAttributeAsDisplaySet,
      {
        attributeName: 'Modality',
        displaySetSelectorId: 'currentDisplaySetId',
      }
    );
  },
  getLayoutTemplateModule,
  getHangingProtocolModule,
};

export default dentalExtension;
