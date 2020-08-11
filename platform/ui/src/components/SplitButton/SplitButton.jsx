import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { IconButton, Icon, Tooltip, ListMenu } from '@ohif/ui';

const classes = {
  Button: "h-10 flex items-center rounded-md border-transparent border-2 hover:border-primary-dark cursor-pointer",
  Interface: "h-full flex flex-row items-center",
  Primary: "h-full flex items-center rounded-md rounded-tr-none rounded-br-none flex-1 bg-secondary-dark hover:bg-primary-dark",
  Secondary: "h-full flex items-center bg-secondary-dark hover:bg-primary-dark",
  Separator: "border-l pt-3 pb-3",
  Content: "absolute z-10 top-0 mt-16"
};

const SplitButton = ({
  isActive,
  primary,
  secondary,
  onClick,
  items: _items,
  renderer,
}) => {
  const [state, setState] = useState({ isHovering: false, isExpanded: false });

  const onMouseEnterHandler = () => setState(state => ({ ...state, isHovering: true }));
  const onMouseLeaveHandler = () => setState(state => ({ ...state, isHovering: false }));

  /* Bubble individual item clicks */
  const items = _items.map((item, index) => ({
    ...item,
    onClick: (...args) => {
      onClick({ id: item.id, index, ...args });
      item.onClick(...args);
    }
  }));

  const onSecondaryClickHandler = (...args) => {
    setState(state => ({ ...state, isExpanded: !state.isExpanded }));
    secondary.onClick(...args);
  };

  return (
    <div
      name="SplitButton"
      className={classes.Button}
      onMouseEnter={onMouseEnterHandler}
      onMouseLeave={onMouseLeaveHandler}
    >
      <div className={classes.Interface}>
        <div className={classes.Primary}>
          <Tooltip content={primary.tooltip}>
            <div className="p-2">
              <Icon name={primary.icon} className="w-5 h-5 text-primary-light" />
            </div>
          </Tooltip>
        </div>
        <div
          className={
            classNames(
              classes.Separator,
              state.isHovering ? "border-transparent" : "border-primary-active"
            )}
        >
        </div>
        <div className={classes.Secondary} onClick={onSecondaryClickHandler}>
          <Tooltip isDisabled={state.isExpanded} content={secondary.tooltip}>
            <Icon name={secondary.icon} className="text-primary-active" />
          </Tooltip>
        </div>
      </div>
      <div
        className={
          classNames(
            classes.Content,
            state.isExpanded ? "block" : "hidden"
          )}
      >
        <ListMenu options={items} renderer={renderer} />
      </div>
    </div>
  );
};

const ListRenderer = ({ icon, text, isActive, index }) => (
  <div className="flex flex-row">
    <span className={classNames(isActive ? "text-black" : "text-white", "mr-2 text-base")}>
      <Icon name={icon} className="w-5 h-5 text-primary-light" />
    </span>
    <span className={classNames(isActive ? "text-black" : "text-aqua-pale", "font-thin text-sm")}>
      {text}
    </span>
  </div>
);

SplitButton.defaultProps = {
  isActive: false,
  secondary: {
    icon: 'chevron-down',
    tooltip: 'Expand'
  },
  items: [],
  renderer: ListRenderer
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
      text: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired
    })
  )
};

export default SplitButton;
