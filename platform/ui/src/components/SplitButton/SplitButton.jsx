import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { IconButton, Icon, Tooltip } from '@ohif/ui';

const SplitButton = ({
  isActive,
  primary,
  secondary,
  onClick,
  items
}) => {
  const classes = {
    type: {
      primary: isActive
        ? 'text-black'
        : 'text-common-bright hover:bg-primary-dark hover:text-primary-light',
      secondary: isActive
        ? 'text-black'
        : 'text-white hover:bg-secondary-dark hover:text-white focus:bg-secondary-dark focus:text-white',
    },
  };

  return (
    <div key={id}>
      <Tooltip isSticky tight>
        <IconButton
          variant={isActive ? 'contained' : 'text'}
          className={classnames('mx-1', classes.type[type])}
          onClick={onClick}
          key={id}
        >
          <Icon name={icon} />
        </IconButton>
      </Tooltip>
    </div>
  );
};

SplitButton.propTypes = {
  isActive: PropTypes.bool,
  primary: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    tooltip: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    component: PropTypes.node
  }),
  secondary: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    tooltip: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    component: PropTypes.node
  }),
  onClick: PropTypes.func.isRequired,
  itemRenderer: PropTypes.func,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      onClick: PropTypes.func.isRequired
    })
  )
};

export default SplitButton;
