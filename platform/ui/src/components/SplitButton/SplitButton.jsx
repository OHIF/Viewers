import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import OutsideClickHandler from 'react-outside-click-handler';

import { IconButton, Icon, Tooltip, ListMenu } from '@ohif/ui';

const baseClasses = {
  Button: 'h-10 flex items-center rounded-md border-transparent border-2 cursor-pointer',
  Primary: 'h-full flex items-center rounded-tl-md rounded-bl-md hover:rounded-tl-none hover:rounded-bl-none rounded-tr-none rounded-br-none flex-1',
  Secondary: 'h-full flex items-center',
  PrimaryIcon: 'w-5 h-5 stroke-2',
  SecondaryIcon: 'h-full',
  Separator: 'border-l pt-3 pb-3',
  Content: 'absolute z-10 top-0 mt-16'
};

const classes = {
  Button: ({ isExpanded, primary }) => classNames(
    baseClasses.Button,
    !isExpanded && !primary.isActive && 'hover:border-primary-dark'
  ),
  Interface: 'h-full flex flex-row items-center',
  Primary: ({ primary, isExpanded }) => classNames(
    baseClasses.Primary,
    primary.isActive && !isExpanded ? 'bg-primary-light rounded-tr-md rounded-br-md' :
      isExpanded ? 'bg-primary-dark' : 'bg-secondary-dark hover:bg-primary-dark'
  ),
  Secondary: ({ isExpanded, primary }) => classNames(
    baseClasses.Secondary,
    isExpanded ? 'bg-primary-light rounded-tr-md rounded-br-md'
      : primary.isActive ? 'bg-transparent' : 'hover:bg-primary-dark bg-transparent'
  ),
  PrimaryIcon: ({ primary, isExpanded }) => classNames(
    baseClasses.PrimaryIcon,
    primary.isActive && !isExpanded ? 'text-primary-dark' : 'text-primary-light'
  ),
  SecondaryIcon: ({ isExpanded }) => classNames(
    baseClasses.SecondaryIcon,
    isExpanded ? 'text-primary-dark' : 'text-primary-active hover:text-primary-light'
  ),
  Separator: ({ primary, isExpanded, isHovering }) => classNames(
    baseClasses.Separator,
    isHovering || isExpanded || primary.isActive ? 'border-transparent' : 'border-primary-active'
  ),
  Content: ({ isExpanded }) => classNames(baseClasses.Content, isExpanded ? 'block' : 'hidden')
};

const SplitButton = ({
  isActive,
  isRadio,
  primary: _primary,
  secondary,
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

      setState(state => ({
        ...state,
        primary: { ...item, index },
        isExpanded: false,
        items: getSplitButtonItems(_items).filter(item => isRadio ? item.index !== index : true)
      }));
    }
  }));

  const [state, setState] = useState({
    primary: _primary,
    items: getSplitButtonItems(_items),
    isHovering: false,
    isExpanded: false
  });

  const onSecondaryClickHandler = () => setState(state => ({ ...state, isExpanded: !state.isExpanded }));
  const onMouseEnterHandler = () => setState(state => ({ ...state, isHovering: true }));
  const onMouseLeaveHandler = () => setState(state => ({ ...state, isHovering: false }));
  const outsideClickHandler = () => setState(state => ({ ...state, isExpanded: false }));
  const onPrimaryClickHandler = () => {
    const primary = { ...state.primary, isActive: !state.primary.isActive };
    state.primary.onClick(primary);
    setState(state => ({ ...state, isExpanded: false, primary }));
  };

  return (
    <OutsideClickHandler onOutsideClick={outsideClickHandler}>
      <div name='SplitButton'>
        <div
          className={classes.Button({ ...state })}
          onMouseEnter={onMouseEnterHandler}
          onMouseLeave={onMouseLeaveHandler}
        >
          <div className={classes.Interface}>
            <div onClick={onPrimaryClickHandler} className={classes.Primary({ ...state })}>
              <Tooltip isDisabled={!state.primary.tooltip} content={state.primary.tooltip}>
                <div className='p-2'>
                  <Icon name={state.primary.icon} className={classes.PrimaryIcon({ ...state })} />
                </div>
              </Tooltip>
            </div>
            <div className={classes.Separator({ ...state })}></div>
            <div className={classes.Secondary({ ...state })} onClick={onSecondaryClickHandler}>
              <Tooltip isDisabled={state.isExpanded || !secondary.tooltip} content={secondary.tooltip} className="h-full">
                <Icon name={secondary.icon} className={classes.SecondaryIcon({ ...state })} />
              </Tooltip>
            </div>
          </div>
        </div>
        <div className={classes.Content({ ...state })}>
          <ListMenu items={state.items} renderer={renderer} />
        </div>
      </div>
    </OutsideClickHandler>
  );
};

const DefaultListItemRenderer = ({ icon, label, isActive }) => (
  <div className={classNames(
    'flex flex-row items-center p-3 h-8 w-full hover:bg-primary-dark',
    isActive && 'bg-primary-dark'
  )}
  >
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
  isRadio: false,
  primary: {
    label: null,
    tooltip: null,
    isActive: true,
    onClick: noop
  },
  secondary: {
    icon: 'chevron-down',
    label: null,
    isActive: true,
    tooltip: 'Expand'
  },
  items: [],
  renderer: DefaultListItemRenderer,
  onClick: noop
};

SplitButton.propTypes = {
  isActive: PropTypes.bool,
  primary: PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string,
    tooltip: PropTypes.string,
    isActive: PropTypes.bool,
  }),
  secondary: PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string,
    tooltip: PropTypes.string,
    isActive: PropTypes.bool
  }),
  onClick: PropTypes.func,
  renderer: PropTypes.func,
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
