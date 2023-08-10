import React, { useState } from 'react';
import { Icon } from '@ohif/ui';
import PropTypes from 'prop-types';

const PanelSection = ({ title, children }) => {
  const [isChildrenVisible, setChildrenVisible] = useState(true);

  const handleHeaderClick = () => {
    setChildrenVisible(!isChildrenVisible);
  };

  return (
    <>
      <div
        className="flex justify-between h-7 bg-primary-dark px-2.5 items-center cursor-pointer select-none"
        onClick={handleHeaderClick}
      >
        <div className="text-aqua-pale">{title}</div>
        <Icon
          name={isChildrenVisible ? 'chevron-down-new' : 'chevron-left-new'}
        />
      </div>
      {isChildrenVisible && children}
    </>
  );
};

PanelSection.defaultProps = {};

PanelSection.propTypes = {
  title: PropTypes.string,
};

export default PanelSection;
