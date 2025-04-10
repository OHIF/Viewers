import React from 'react';
import { useTranslation } from 'react-i18next';
import { ViewportActionButton } from '@ohif/ui-next';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';

export default function _getStatusComponent({ isHydrated, onStatusClick }) {
  let ToolTipMessage = null;
  let StatusIcon = null;

  switch (isHydrated) {
    case true:
      StatusIcon = () => <Icons.ByName name="status-alert" />;
      ToolTipMessage = () => <div>This Segmentation is loaded in the segmentation panel</div>;
      break;
    case false:
      StatusIcon = () => (
        <Icons.ByName
          className="text-muted-foreground h-4 w-4"
          name="status-untracked"
        />
      );
      ToolTipMessage = () => <div>Click LOAD to load segmentation.</div>;
  }

  const StatusArea = () => {
    const { t } = useTranslation('Common');
    const loadStr = t('LOAD');

    return (
      <div className="flex h-6 cursor-default text-sm leading-6 text-white">
        <div className="bg-customgray-100 flex min-w-[45px] items-center rounded-l-xl rounded-r p-1">
          <StatusIcon />
          <span className="ml-1">SEG</span>
        </div>
        {!isHydrated && (
          <ViewportActionButton onInteraction={onStatusClick}>{loadStr}</ViewportActionButton>
        )}
      </div>
    );
  };

  return (
    <>
      {ToolTipMessage && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <StatusArea />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <ToolTipMessage />
          </TooltipContent>
        </Tooltip>
      )}
      {!ToolTipMessage && <StatusArea />}
    </>
  );
}
