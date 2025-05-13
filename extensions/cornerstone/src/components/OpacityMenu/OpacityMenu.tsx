import React from 'react';
import { Numeric, cn } from '@ohif/ui-next';
import { useViewportRendering } from '../../hooks';

interface OpacityMenuProps {
  viewportId: string;
  className?: string;
}

function OpacityMenu({ viewportId, className }: OpacityMenuProps) {
  const { opacity, setOpacity } = useViewportRendering(viewportId);

  const opacityValue = opacity;

  return (
    <div className={className}>
      <div className="bg-popover w-72 rounded-lg p-4 shadow-md">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-medium">Opacity</h3>
          <span className="text-muted-foreground text-sm">{(opacityValue * 100).toFixed(0)}%</span>
        </div>
        <div className="py-2">
          <Numeric.Container
            mode="singleRange"
            value={opacityValue}
            onChange={(val: number | [number, number]) => {
              if (typeof val === 'number') {
                setOpacity(val);
              }
            }}
            min={0}
            max={1}
            step={0.01}
          >
            <Numeric.SingleRange showNumberInput={false} />
          </Numeric.Container>
        </div>
      </div>
    </div>
  );
}

export default OpacityMenu;
