import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { Button, Icon } from '@ohif/ui';

const baseStyle = {
  maxWidth: '320px',
};

const dynamicStyle = {
  open: {
    left: {},
    right: {},
  },
  closed: {
    left: {},
    right: {},
  },
};

const sideClasses = {
  left: 'border-r-4',
  right: 'border-l-4',
};

const baseClassName =
  'transition-all duration-300 ease-in-out h-100 bg-primary-light border-black';

const SidePanel = ({
  side,
  className,
  children,
  defaultIsOpen,
  componentName,
  iconName,
}) => {
  const [isOpen, setIsOpen] = useState(defaultIsOpen);
  const openStatus = isOpen ? 'open' : 'closed';
  const style = Object.assign({}, dynamicStyle[openStatus][side]);

  return (
    <div
      className={classnames(className, baseClassName, sideClasses[side])}
      style={style}
    >
      {isOpen ? (
        <React.Fragment>
          <div className="border-b-1">
            {componentName}
            <Button onClick={() => setIsOpen(false)}>
              <Icon name="chevron-right" />
            </Button>
          </div>
          {children}
        </React.Fragment>
      ) : (
        <Button onClick={() => setIsOpen(true)}>
          <div>
            <Icon name={iconName} />
            {componentName}
          </div>
        </Button>
      )}
    </div>
  );
};

SidePanel.defaultProps = {
  defaultIsOpen: false,
};

SidePanel.propTypes = {
  side: PropTypes.oneOf(['left', 'right']).isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
  isOpen: PropTypes.bool,
};

export default SidePanel;
