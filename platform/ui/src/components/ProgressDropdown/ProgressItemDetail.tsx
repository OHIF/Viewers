import React, { useState, useMemo, ReactElement } from 'react';
import { Icon, Tooltip } from '../../components';
import { ProgressDropdownOption, ProgressDropdownOptionPropType } from './types';

const MAX_TOOLTIP_LENGTH = 150;
const iconClassNames = 'grow-0 text-primary-light h-4 w-4 mt-1 mr-2 mb-0 ml-1';

const ProgressItemDetail = ({ option }: { option: ProgressDropdownOption }): ReactElement => {
  const { label, info, completed } = option;
  const [truncate, setTruncate] = useState(true);
  const handleOnHideTooltip = () => setTruncate(true);
  let icon;

  if (completed) {
    icon = 'status-tracked';
  } else if (info) {
    icon = 'launch-info';
  }

  const tooltipText = useMemo(() => {
    if (!truncate || !info || info.length <= MAX_TOOLTIP_LENGTH) {
      return info;
    }

    const handleReadMoreClick = e => {
      setTruncate(false);
      e.stopPropagation();
      e.preventDefault();
    };

    return (
      <>
        {info.slice(0, MAX_TOOLTIP_LENGTH)}
        <button
          className="text-primary-active font-bold"
          onClick={handleReadMoreClick}
        >
          &nbsp;Read more...
        </button>
      </>
    );
  }, [info, truncate]);

  const iconContent = (
    <>
      {icon && (
        <div>
          <Icon
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
        <Tooltip
          content={tooltipText}
          position="bottom-left"
          tooltipBoxClassName={'max-w-xs'}
          onHide={handleOnHideTooltip}
        >
          {iconContent}
        </Tooltip>
      )}
      {!info && iconContent}

      <div className="grow text-base leading-6">{label}</div>
    </>
  );
};

ProgressItemDetail.propTypes = {
  option: ProgressDropdownOptionPropType.isRequired,
};

export default ProgressItemDetail;
