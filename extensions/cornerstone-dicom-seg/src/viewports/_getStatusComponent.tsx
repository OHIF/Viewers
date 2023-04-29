import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Tooltip } from '@ohif/ui';


export default function _getStatusComponent({ isHydrated, onStatusClick }) {
  let ToolTipMessage = null;
  let StatusIcon = null;

  const {t} = useTranslation("Common");
  const loadStr = t("LOAD");

  switch (isHydrated) {
    case true:
      StatusIcon = () => <Icon name="status-alert" />;

      ToolTipMessage = () => (
        <div>This Segmentation is loaded in the segmentation panel</div>
      );
      break;
  case false:
      StatusIcon = () => <Icon name="status-untracked" />;

      ToolTipMessage = () => <div>Click LOAD to load segmentation.</div>;
  }

  const StatusArea = () => (
    <div className="flex h-6 leading-6 cursor-default text-sm text-white">
      <div className="min-w-[45px] flex items-center p-1 rounded-l-xl rounded-r bg-customgray-100">
        <StatusIcon />
        <span className="ml-1">SEG</span>
      </div>
      {!isHydrated && (
        <div
          className="ml-1 px-1.5 rounded cursor-pointer hover:text-black bg-primary-main hover:bg-primary-light"
          // Using onMouseUp here because onClick is not working when the viewport is not active and is styled with pointer-events:none
          onMouseUp={onStatusClick}
        >
          {loadStr}
        </div>
      )}
    </div>
  );


  return (
    <>
      {ToolTipMessage && (
        <Tooltip content={<ToolTipMessage />} position="bottom-left">
          <StatusArea />
        </Tooltip>
      )}
      {!ToolTipMessage && <StatusArea />}
    </>
  );
}
