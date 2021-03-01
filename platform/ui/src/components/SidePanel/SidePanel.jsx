import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Button, Icon } from '../';

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

const getChildComponent = (childComponents, componentOpen) => {
  if (Array.isArray(childComponents)) {
    return childComponents.find(
      _childComponent => _childComponent.name === componentOpen
    );
  } else {
    return childComponents;
  }
};

const SidePanel = ({
  side,
  className,
  defaultComponentOpen,
  childComponents,
}) => {
  const [componentOpen, setComponentOpen] = useState(defaultComponentOpen);

  const openStatus = componentOpen ? 'open' : 'closed';
  const style = Object.assign({}, styleMap[openStatus][side], baseStyle);

  const childComponent = getChildComponent(childComponents, componentOpen);

  const getPanelButtons = () => {
    const _childComponents = Array.isArray(childComponents)
      ? childComponents
      : [childComponents];
    return _childComponents.map((childComponent, i) => {
      return (
        <Button
          key={i}
          variant="text"
          color="inherit"
          onClick={() => {
            setComponentOpen(childComponent.name);
          }}
          style={{
            minWidth: `${collapsedWidth}px`,
            width: `${collapsedWidth}px`,
          }}
          name={childComponent.name}
          className="flex flex-col text-xs px-1 py-1 text-white border-transparent border-b"
        >
          <Icon
            name={childComponent.iconName}
            className="text-primary-active"
          />
          <span className="mt-2 text-white text-xs">
            {childComponent.iconLabel}
          </span>
        </Button>
      );
    });
  };

  return (
    <div
      className={classnames(
        className,
        baseClasses,
        classesMap[openStatus][side]
      )}
      style={style}
    >
      {componentOpen ? (
        <React.Fragment>
          <div className="px-3 border-b border-secondary-light">
            <Button
              variant="text"
              color="inherit"
              rounded="none"
              onClick={() => {
                setComponentOpen(null);
              }}
              name={childComponent.name}
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
                {childComponent.label}
              </span>
            </Button>
          </div>
          <childComponent.content/>
        </React.Fragment>
      ) : (
        <React.Fragment>{getPanelButtons()}</React.Fragment>
      )}
    </div>
  );
};

SidePanel.defaultProps = {
  defaultComponentOpen: null,
};

SidePanel.propTypes = {
  side: PropTypes.oneOf(['left', 'right']).isRequired,
  className: PropTypes.string,
  defaultComponentOpen: PropTypes.string,
  childComponents: PropTypes.oneOfType([
    PropTypes.shape({
      iconName: PropTypes.string.isRequired,
      iconLabel: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      content: PropTypes.func, // TODO: Should be node, but it keeps complaining?
    }),
    PropTypes.arrayOf(
      PropTypes.shape({
        iconName: PropTypes.string.isRequired,
        iconLabel: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        content: PropTypes.func, // TODO: Should be node, but it keeps complaining?
      })
    ),
  ]),
};

export default SidePanel;
