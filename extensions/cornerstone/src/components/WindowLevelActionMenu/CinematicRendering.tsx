import { ButtonEnums } from '@ohif/ui';
import React, { ReactElement, useState, useEffect, useCallback } from 'react';
import { Button, InputRange } from '@ohif/ui';
import { CinematicRenderingProps } from '../../types/ViewportPresets';

export function CinematicRendering({
  viewportId,
  serviceManager,
  onClose,
}: CinematicRenderingProps): ReactElement {
  return (
    <div className="flex min-h-full w-full flex-col justify-between">
      <div className=" h-[60px] w-full overflow-hidden px-2.5">
        <div className="flex h-[46px] w-full items-center justify-center">
          <InputRange
            minValue={1}
            maxValue={4}
            step={1}
            value={1}
            onChange={() => {}}
            showLabel={false}
            inputClassName="w-full"
            containerClassName="w-[90%]"
            labels={[
              { text: 'Good', position: 0 },
              { text: 'Better', position: 31.3 },
              { text: 'Ultra', position: 63.6 },
              { text: 'Extreme', position: 94 },
            ]}
          />
        </div>
      </div>
      <footer className="flex h-[60px] w-full items-center justify-end">
        <div className="flex gap-2">
          <Button
            name="Cancel"
            size={ButtonEnums.size.medium}
            type={ButtonEnums.type.secondary}
            onClick={onClose}
          >
            {' '}
            Cancel{' '}
          </Button>
          <Button
            name="Apply"
            size={ButtonEnums.size.medium}
            type={ButtonEnums.type.primary}
            onClick={() => {}}
          >
            {' '}
            Apply{' '}
          </Button>
        </div>
      </footer>
    </div>
  );
}
