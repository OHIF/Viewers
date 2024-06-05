import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import IconButton from '../IconButton';
import Icon from '../Icon';

import './ExpandableToolbarButton.css';

const ExpandableToolbarButton = ({
  type = 'primary',
  id = '',
  isActive = false,
  onClick = () => {},
  icon = 'clipboard',
  className,
  content: Content = null,
  contentProps = {},
}) => {
  const classes = {
    type: {
      primary: isActive
        ? 'text-black'
        : 'text-common-bright hover:bg-primary-dark hover:text-primary-light',
      secondary: isActive
        ? 'text-black'
        : 'text-white hover:bg-secondary-dark focus:bg-secondary-dark',
    },
  };

  const onChildClickHandler = (...args) => {
    onClick(...args);

    if (contentProps.onClick) {
      contentProps.onClick(...args);
    }
  };

  const onClickHandler = (...args) => {
    onClick(...args);
  };

  return (
    <div
      key={id}
      className="ExpandableToolbarButton"
    >
      <IconButton
        variant={isActive ? 'contained' : 'text'}
        className={classnames(
          'mx-1',
          classes.type[type],
          isActive && 'ExpandableToolbarButton__arrow'
        )}
        onClick={onClickHandler}
        key={id}
      >
        <Icon name={icon} />
      </IconButton>
      <div className="absolute z-10 pt-4">
        <div className={classnames('ExpandableToolbarButton__content w-48', className)}>
          <Content
            {...contentProps}
            onClick={onChildClickHandler}
          />
        </div>
      </div>
    </div>
  );
};

const noop = () => {};

ExpandableToolbarButton.propTypes = {
  /* Influences background/hover styling */
  type: PropTypes.oneOf(['primary', 'secondary']),
  id: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  /** Expandable toolbar button content can be replaced for a customized content by passing a node to this value. */
  content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  contentProps: PropTypes.object,
};

export default ExpandableToolbarButton;
