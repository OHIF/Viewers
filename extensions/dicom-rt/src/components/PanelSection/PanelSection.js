import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';

import './PanelSection.css';
import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';

const PanelSection = ({
  title,
  children,
  visible = false,
  expanded = false,
  loading = false,
  hideVisibleButton = false,
  onVisibilityChange = () => { },
  onExpandChange = () => { }
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

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
        <div className="icons">
          {!hideVisibleButton && (
            <Icon
              className={`eye-icon ${isVisible && 'expanded'}`}
              name={isVisible ? "eye" : "eye-closed"}
              width="20px"
              height="20px"
              onClick={() => {
                const newVisibility = !isVisible;
                setIsVisible(newVisibility);
                onVisibilityChange(newVisibility);
              }}
            />
          )}
          <Icon
            className={`angle-double-${isExpanded ? 'down' : 'up'} ${isExpanded && 'expanded'}`}
            name={`angle-double-${isExpanded ? 'down' : 'up'}`}
            width="20px"
            height="20px"
            onClick={() => {
              const newExpandValue = !isExpanded;
              setIsExpanded(newExpandValue);
              onExpandChange(newExpandValue);
            }}
          />
        </div>
      </div>
      {loading && isExpanded && <LoadingIndicator expand height="70px" width="70px" />}
      {children}
    </div>
  );
};

PanelSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  visible: PropTypes.bool,
  expanded: PropTypes.bool,
  onVisibilityChange: PropTypes.func
};

PanelSection.defaultProps = {
  visible: false,
  expanded: false,
  onVisibilityChange: () => { }
};

export default PanelSection;
