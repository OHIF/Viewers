import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Button, Icon } from '@ohif/ui';

const borderSize = 4;
const expandedWidth = 248;
const collapsedWidth = 56;

const baseStyle = {
  maxWidth: `${expandedWidth}px`,
  width: `${expandedWidth}px`,
};

const collapsedHideWidth = expandedWidth - collapsedWidth - borderSize;
const styleMap = {
  open: {
    left: { marginLeft: '0px' },
    right: { marginRight: '0px' },
  },
  closed: {
    left: { marginLeft: `-${collapsedHideWidth}px` },
    right: { marginRight: `-${collapsedHideWidth}px` },
  },
};

const baseClasses =
  'transition-all duration-300 ease-in-out h-100 bg-primary-dark border-black flex flex-col justify-start box-content';

const classesMap = {
  open: {
    left: `border-r-${borderSize}`,
    right: `border-l-${borderSize}`,
  },
  closed: {
    left: `border-r-${borderSize} items-end`,
    right: `border-l-${borderSize} items-start`,
  },
};

const openIconName = {
  left: 'push-left',
  right: 'push-right',
};

const position = {
  left: {
    right: 5,
  },
  right: {
    left: 5,
  },
};

const SidePanel = ({
  side,
  className,
  children,
  defaultIsOpen,
  componentLabel,
  iconLabel,
  iconName,
}) => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);
  const openStatus = isOpen ? 'open' : 'closed';
  const style = Object.assign({}, styleMap[openStatus][side], baseStyle);

  const getSidePanelHeader = useCallback(() => {
    return (
      <React.Fragment>
        {isOpen ? (
          <div className="px-3 border-b border-secondary-light">
            <Button
              variant="text"
              color="inherit"
              rounded="none"
              onClick={() => {
                setIsOpen(false);
              }}
              className="flex flex-row items-center px-3 h-12 relative w-full"
            >
              <Icon
                name={openIconName[side]}
                className={classnames(
                  'text-primary-active absolute',
                  side === 'left' && 'order-last'
                )}
                style={{ ...position[side] }}
              />
              <span className="flex-1 text-primary-active">
                {componentLabel}
              </span>
            </Button>
          </div>
        ) : (
          <Button
            variant="text"
            color="inherit"
            onClick={() => {
              setIsOpen(true);
            }}
            style={{
              minWidth: `${collapsedWidth}px`,
              width: `${collapsedWidth}px`,
            }}
            className="flex flex-col text-xs px-1 py-1 text-white border-transparent border-b"
          >
            <Icon name={iconName} className="text-primary-active" />
            <span className="mt-2 text-white text-xs">{iconLabel}</span>
          </Button>
        )}
      </React.Fragment>
    );
  }, [componentLabel, iconLabel, iconName, isOpen, side]);

  return (
    <div
      className={classnames(
        className,
        baseClasses,
        classesMap[openStatus][side]
      )}
      style={style}
    >
      {getSidePanelHeader()}
      {isOpen && children}
    </div>
  );
};

SidePanel.defaultProps = {
  defaultIsOpen: false,
};

SidePanel.propTypes = {
  side: PropTypes.oneOf(['left', 'right']).isRequired,
  iconLabel: PropTypes.string.isRequired,
  componentLabel: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  defaultIsOpen: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default SidePanel;
