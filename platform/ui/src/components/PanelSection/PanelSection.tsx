import React, { useState } from 'react';
import { Icon } from '@ohif/ui';
import PropTypes from 'prop-types';

const PanelSection = ({ title, children, actionIcons = [] }) => {
  const [isChildrenVisible, setChildrenVisible] = useState(true);

  const handleHeaderClick = () => {
    setChildrenVisible(!isChildrenVisible);
  };

  return (
    <>
      <div
        className="bg-secondary-dark mt-[2px] flex h-7 cursor-pointer select-none items-center justify-between rounded-[4px] pl-2.5 text-[13px]"
        onClick={handleHeaderClick}
      >
        <div className="text-aqua-pale">{title}</div>
        <div className="flex items-center space-x-1">
          {actionIcons.map((icon, index) => (
            <Icon
              key={index}
              name={icon.name}
              onClick={e => {
                e.stopPropagation();
                if (!isChildrenVisible) {
                  setChildrenVisible(true);
                }
                icon.onClick();
              }}
            />
          ))}
          <div className="grid h-[28px] w-[28px] place-items-center">
            <Icon name={isChildrenVisible ? 'chevron-down-new' : 'chevron-left-new'} />
          </div>
        </div>
      </div>
      {isChildrenVisible && (
        <>
          <div className="h-[2px] bg-black"></div>
          <div className="bg-primary-dark rounded-b-[4px]">{children}</div>
        </>
      )}
    </>
  );
};

PanelSection.defaultProps = {};

PanelSection.propTypes = {
  title: PropTypes.string,
};

export default PanelSection;
