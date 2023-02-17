import React from 'react';
import classNames from 'classnames';
import { Icon, Tooltip } from '@ohif/ui';

import _hydrateRTDisplaySet from '../utils/_hydrateRT';

export default function _getStatusComponent({ isHydrated, onPillClick }) {
  let ToolTipMessage = null;
  let StatusIcon = null;

  switch (isHydrated) {
    case true:
      StatusIcon = () => (
        <div
          className="flex items-center justify-center -mr-1 rounded-full"
          style={{
            width: '18px',
            height: '18px',
            backgroundColor: '#98e5c1',
            border: 'solid 1.5px #000000',
          }}
        >
          <Icon
            name="exclamation"
            style={{ color: '#000', width: '12px', height: '12px' }}
          />
        </div>
      );

      ToolTipMessage = () => (
        <div>This Segmentation is loaded in the segmentation panel</div>
      );
      break;
    case false:
      StatusIcon = () => (
        <div
          className="flex items-center justify-center -mr-1 bg-white rounded-full group-hover:bg-customblue-200"
          style={{
            width: '18px',
            height: '18px',
            border: 'solid 1.5px #000000',
          }}
        >
          <Icon
            name="arrow-left"
            style={{ color: '#000', width: '14px', height: '14px' }}
          />
        </div>
      );

      ToolTipMessage = () => <div>Click to load segmentation.</div>;
  }

  const StatusPill = () => (
    <div
      className={classNames(
        'group relative flex items-center justify-center px-8 rounded-full cursor-default bg-customgreen-100',
        {
          'hover:bg-customblue-100': !isHydrated,
          'cursor-pointer': !isHydrated,
        }
      )}
      style={{
        height: '24px',
        width: '55px',
      }}
      onClick={() => {
        if (!isHydrated) {
          if (onPillClick) {
            onPillClick();
          }
        }
      }}
    >
      <div className="pr-1 text-base font-medium leading-none text-black">
        RT
      </div>
      <StatusIcon />
    </div>
  );

  return (
    <>
      {ToolTipMessage && (
        <Tooltip content={<ToolTipMessage />} position="bottom-left">
          <StatusPill />
        </Tooltip>
      )}
      {!ToolTipMessage && <StatusPill />}
    </>
  );
}
