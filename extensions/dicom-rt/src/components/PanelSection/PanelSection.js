import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';

import './PanelSection.css';

const PanelSection = ({
  title,
  children,
  visible = false,
  expanded = false,
  onVisibilityChange = () => { }
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isVisible, setIsVisible] = useState(visible);
  return (
    <div
      className="dcmrt-panel-section"
      style={{
        marginBottom: isExpanded ? 0 : 2,
        height: isExpanded ? '100%' : 'unset'
      }}
    >
      <div className="header">
        <div>{title}</div>
        <Icon
          className={`eye-icon ${isVisible && 'expanded'}`}
          name="eye"
          width="20px"
          height="20px"
          onClick={() => {
            const newVisibility = !isVisible;
            setIsVisible(newVisibility);
            onVisibilityChange(newVisibility);
          }}
        />
        <Icon
          className={`angle-double-${isExpanded ? 'down' : 'up'} ${isExpanded && 'expanded'}`}
          name={`angle-double-${isExpanded ? 'down' : 'up'}`}
          width="20px"
          height="20px"
          onClick={() => setIsExpanded(!isExpanded)}
        />
      </div>
      {children}
    </div>
  );
};

export default PanelSection;
