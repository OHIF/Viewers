import React from 'react';
import { Numeric } from '@ohif/ui-next';
import { useViewportDisplaySets, useViewportRendering } from '../../hooks';

interface OpacityMenuProps {
  viewportId: string;
  className?: string;
}

function OpacityMenu({ viewportId, className }: OpacityMenuProps) {
  const { backgroundDisplaySet, foregroundDisplaySets } = useViewportDisplaySets(viewportId, {
    includeForeground: true,
    includeBackground: true,
  });
  const { opacityLinear, setOpacityLinear } = useViewportRendering(viewportId, {
    displaySetInstanceUID: foregroundDisplaySets[0].displaySetInstanceUID,
  });

  const opacityValue = opacityLinear !== undefined ? opacityLinear : 0;
  const backgroundModality = backgroundDisplaySet?.Modality || '';
  const foregroundModality = foregroundDisplaySets[0]?.Modality || '';

  return (
    <div className={className}>
      <div className="bg-popover w-72 rounded-lg p-3">
        <div className="mb-2 flex items-center justify-center">
          <span className="text-muted-foreground text-base">Opacity</span>
        </div>
        <div className="">
          <Numeric.Container
            mode="singleRange"
            value={opacityValue}
            onChange={(val: number | [number, number]) => {
              if (typeof val === 'number') {
                setOpacityLinear(val);
              }
            }}
            min={0}
            max={1}
            step={0.0001}
          >
            <div className="flex items-center">
              <span className="text-foreground mr-2 text-sm">{backgroundModality}</span>
              <Numeric.SingleRange showNumberInput={false} />
              <span className="text-foreground ml-2 text-sm">{foregroundModality}</span>
            </div>
          </Numeric.Container>
        </div>
      </div>
    </div>
  );
}

export default OpacityMenu;
