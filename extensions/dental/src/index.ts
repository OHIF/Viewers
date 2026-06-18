import { Types } from '@ohif/core';

import getLayoutTemplateModule from './getLayoutTemplateModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import getPanelModule from './getPanelModule';
import sameAttributeAsDisplaySet from './customAttributes/sameAttributeAsDisplaySet';
import { DentalMeasurementsService } from './measurements/DentalMeasurementsService';
import { id } from './id';

const dentalExtension: Types.Extensions.Extension = {
  id,
  preRegistration: ({ servicesManager }: Types.Extensions.ExtensionParams) => {
    const { hangingProtocolService } = servicesManager.services;
    servicesManager.registerService(DentalMeasurementsService.REGISTRATION);

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
  getPanelModule,
};

export default dentalExtension;
