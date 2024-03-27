import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Tooltip } from '@ohif/ui';

export default function _getStatusComponent({ isHydrated, onStatusClick }) {
  let ToolTipMessage = null;
  let StatusIcon = null;

  switch (isHydrated) {
    case true:
      StatusIcon = () => <Icon name="status-alert" />;

      ToolTipMessage = () => <div>This Segmentation is loaded in the segmentation panel</div>;
      break;
    case false:
      StatusIcon = () => (
        <Icon
          className="text-aqua-pale"
          name="status-untracked"
        />
      );

      ToolTipMessage = () => <div>Click LOAD to load RTSTRUCT.</div>;
  }

  const StatusArea = () => {
    const { t } = useTranslation('Common');
    const loadStr = t('LOAD');

    return (
      <div className="flex h-6 cursor-default text-sm leading-6 text-white">
        <div className="bg-customgray-100 flex min-w-[45px] items-center rounded-l-xl rounded-r p-1">
          <StatusIcon />
          <span className="ml-1">RTSTRUCT</span>
        </div>
        {!isHydrated && (
          <div
            className="bg-primary-main hover:bg-primary-light ml-1 cursor-pointer rounded px-1.5 hover:text-black"
            // Using onMouseUp here because onClick is not working when the viewport is not active and is styled with pointer-events:none
            onMouseUp={onStatusClick}
          >
            {loadStr}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {ToolTipMessage && (
        <Tooltip
          content={<ToolTipMessage />}
          position="bottom-left"
        >
          <StatusArea />
        </Tooltip>
      )}
      {!ToolTipMessage && <StatusArea />}
    </>
  );
}
