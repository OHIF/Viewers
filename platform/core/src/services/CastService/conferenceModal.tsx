import { Icon } from '@ohif/ui';
import { ButtonEnums } from '@ohif/ui';
import React, { ReactElement, useState, useCallback } from 'react';
import { Button, InputFilterText } from '@ohif/ui';

export function ConferenceModal({ onClose }): ReactElement {
  return (
    <div className="flex min-h-full w-full flex-col justify-between">
      Would you like to join?
      <Button
        name="Yes"
        size={ButtonEnums.size.medium}
        type={ButtonEnums.type.secondary}
        onClick={onClose}
      >
        Yes
      </Button>
      <Button
        name="No"
        size={ButtonEnums.size.medium}
        type={ButtonEnums.type.secondary}
        onClick={onClose}
      >
        No
      </Button>
    </div>
  );
}
