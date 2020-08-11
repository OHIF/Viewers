import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { IconButton, Icon, Tooltip, ListMenu } from '@ohif/ui';

const classes = {
  Button: 'h-10 flex items-center rounded-md border-transparent border-2 hover:border-primary-dark cursor-pointer',
  Interface: 'h-full flex flex-row items-center',
  Primary: 'h-full flex items-center rounded-md rounded-tr-none rounded-br-none flex-1 bg-secondary-dark hover:bg-primary-dark',
  Secondary: 'h-full flex items-center bg-secondary-dark hover:bg-primary-dark',
  Separator: 'border-l pt-3 pb-3',
  Content: 'absolute z-10 top-0 mt-16'
};

const SplitButton = ({
  primary: _primary,
  secondary,
  isActive,
  isRadio,
  onClick,
  items: _items,
  renderer,
}) => {
  /* Bubbles up individual item clicks */
  const getSplitButtonItems = items => items.map((item, index) => ({
    ...item,
    index,
    onClick: (...args) => {
      if (item.onClick) item.onClick({ ...args, ...item, index });
      onClick({ ...args, item, index });

      if (isRadio) {
        setState(state => ({
          ...state,
          primary: item,
          items: getSplitButtonItems(_items).filter(item => item.index !== index)
        }));
      }
    }
  }));

  const [state, setState] = useState({
    primary: _primary,
    items: getSplitButtonItems(_items),
    isHovering: false,
    isExpanded: false
  });

  const onMouseEnterHandler = () => setState(state => ({ ...state, isHovering: true }));
  const onMouseLeaveHandler = () => setState(state => ({ ...state, isHovering: false }));

  const onPrimaryClickHandler = () => {
    if (state.primary.onClick) state.primary.onClick();
  };

  const onSecondaryClickHandler = (...args) => {
    setState(state => ({ ...state, isExpanded: !state.isExpanded }));
    if (secondary.onClick) secondary.onClick(...args);
  };

  return (
    <div name='SplitButton'>
      <div
        className={classes.Button}
        onMouseEnter={onMouseEnterHandler}
        onMouseLeave={onMouseLeaveHandler}
      >
        <div className={classes.Interface}>
          <div className={classes.Primary} onClick={onPrimaryClickHandler}>
            <Tooltip content={state.primary.tooltip}>
              <div className='p-2'>
                <Icon name={state.primary.icon} className='w-5 h-5 text-primary-light' />
              </div>
            </Tooltip>
          </div>
          <div
            className={
              classNames(
                classes.Separator,
                state.isHovering ? 'border-transparent' : 'border-primary-active'
              )}
          >
          </div>
          <div className={classes.Secondary} onClick={onSecondaryClickHandler}>
            <Tooltip isDisabled={state.isExpanded} content={secondary.tooltip}>
              <Icon name={secondary.icon} className='text-primary-active' />
            </Tooltip>
          </div>
        </div>
      </div>
      <div
        className={
          classNames(
            classes.Content,
            state.isExpanded ? 'block' : 'hidden'
          )}
      >
        <ListMenu items={state.items} renderer={renderer} />
      </div>
    </div>
  );
};

const ListRenderer = ({ icon, label, isActive }) => (
  <div className={classNames('flex flex-row items-center p-3 h-8 w-full hover:bg-primary-dark', isActive && 'bg-primary-dark')}>
    <span className='text-primary-light mr-4 text-base'>
      <Icon name={icon} className='w-5 h-5 text-primary-light' />
    </span>
    <span className='text-aqua-pale font-thin text-sm'>
      {label}
    </span>
  </div >
);

const noop = () => { };

SplitButton.defaultProps = {
  isActive: false,
  primary: {
    label: null,
    tooltip: null,
    isActive: true,
  },
  secondary: {
    icon: 'chevron-down',
    label: '',
    isActive: true,
    tooltip: 'Expand'
  },
  items: [],
  renderer: ListRenderer,
  isRadio: true,
  onClick: noop
};

SplitButton.propTypes = {
  isActive: PropTypes.bool,
  primary: PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string,
    tooltip: PropTypes.string,
    onClick: PropTypes.func,
    isActive: PropTypes.bool,
  }),
  secondary: PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string,
    tooltip: PropTypes.string,
    onClick: PropTypes.func,
    isActive: PropTypes.bool
  }),
  onClick: PropTypes.func,
  itemRenderer: PropTypes.func,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
      label: PropTypes.string,
      tooltip: PropTypes.string,
      onClick: PropTypes.func,
      isActive: PropTypes.bool,
    })
  )
};

export default SplitButton;
