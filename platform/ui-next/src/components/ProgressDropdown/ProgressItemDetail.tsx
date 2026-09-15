import React, { useState, ReactElement } from 'react';
import { Icons } from '../Icons';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../Tooltip';
import { ProgressDropdownOption } from './types';

const MAX_TOOLTIP_LENGTH = 150;
const iconClassNames = 'grow-0 text-highlight h-4 w-4 mt-1 mr-2 mb-0 ml-1';

const ProgressItemDetail = ({ option }: { option: ProgressDropdownOption }): ReactElement<any> => {
  const { label, info, completed } = option;
  const [truncate, setTruncate] = useState(true);
  const handleOnHideTooltip = () => setTruncate(true);
  let icon;

  if (completed) {
    icon = 'status-tracked';
  } else if (info) {
    icon = 'launch-info';
  }

  const handleReadMoreClick = e => {
    setTruncate(false);
    e.stopPropagation();
    e.preventDefault();
  };

  const tooltipText =
    !truncate || !info || info.length <= MAX_TOOLTIP_LENGTH ? (
      info
    ) : (
      <>
        {info.slice(0, MAX_TOOLTIP_LENGTH)}
        <button
          className="text-primary font-bold"
          onClick={handleReadMoreClick}
        >
          &nbsp;Read more...
        </button>
      </>
    );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleOnHideTooltip();
    }
  };

  const iconContent = (
    <>
      {icon && (
        <div>
          <Icons.ByName
            name={icon}
            className={iconClassNames}
          />
        </div>
      )}
      {!icon && <div className={iconClassNames} />}
    </>
  );

  return (
    <>
      {info && (
        <TooltipProvider delayDuration={200}>
          <Tooltip onOpenChange={handleOpenChange}>
            <TooltipTrigger asChild>{iconContent}</TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              className={'max-w-xs'}
            >
              {tooltipText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {!info && iconContent}

      <div className="grow overflow-hidden text-ellipsis whitespace-nowrap text-base leading-6">
        {label}
      </div>
    </>
  );
};



export default ProgressItemDetail;
