import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import OutsideClickHandler from 'react-outside-click-handler';

import { Icon, Tooltip, ListMenu } from '@ohif/ui';

const baseClasses = {
  Button:
    'flex items-center rounded-md border-transparent border-2 cursor-pointer',
  Primary:
    'h-full flex flex-1 items-center rounded-md rounded-tr-none rounded-br-none',
  Secondary:
    'h-full flex items-center justify-center rounded-tr-md rounded-br-md w-4',
  PrimaryIcon: 'w-5 h-5',
  SecondaryIcon: 'w-4 h-full stroke-1',
  Separator: 'border-l pt-2 pb-2',
  Content: 'absolute z-10 top-0 mt-12',
};

const classes = {
  Button: ({ isExpanded, primary }) =>
    classNames(
      baseClasses.Button,
      !isExpanded &&
        !primary.isActive &&
        'hover:bg-primary-dark hover:border-primary-dark'
    ),
  Interface: 'h-full flex flex-row items-center',
  Primary: ({ primary, isExpanded }) =>
    classNames(
      baseClasses.Primary,
      primary.isActive && !isExpanded
        ? 'bg-primary-light rounded-tr-md rounded-br-md active'
        : isExpanded
        ? 'bg-primary-dark'
        : 'bg-secondary-dark hover:bg-primary-dark'
    ),
  Secondary: ({ isExpanded, primary }) =>
    classNames(
      baseClasses.Secondary,
      isExpanded
        ? 'bg-primary-light rounded-tr-md rounded-br-md'
        : primary.isActive
        ? 'bg-secondary-dark'
        : 'hover:bg-primary-dark bg-secondary-dark'
    ),
  PrimaryIcon: ({ primary, isExpanded }) =>
    classNames(
      baseClasses.PrimaryIcon,
      primary.isActive && !isExpanded
        ? 'text-primary-dark'
        : 'text-common-bright'
    ),
  SecondaryIcon: ({ isExpanded }) =>
    classNames(
      baseClasses.SecondaryIcon,
      isExpanded
        ? 'text-primary-dark'
        : 'text-primary-active hover:text-common-bright'
    ),
  Separator: ({ primary, isExpanded, isHovering }) =>
    classNames(
      baseClasses.Separator,
      isHovering || isExpanded || primary.isActive
        ? 'border-transparent'
        : 'border-primary-active'
    ),
  Content: ({ isExpanded }) =>
    classNames(baseClasses.Content, isExpanded ? 'block' : 'hidden'),
};

const SplitButton = ({
  isRadio,
  isAction,
  //
  bState,
  //
  groupId,
  primary: _primary,
  secondary,
  items: _items,
  renderer,
  onInteraction,
}) => {
  const { primaryToolId, toggles } = bState;
  /* Bubbles up individual item clicks */
  const getSplitButtonItems = items =>
    items.map((item, index) => ({
      ...item,
      index,
      onClick: () => {
        onInteraction({
          groupId,
          //
          itemId: item.id,
          interactionType: item.type,
          // splitButtonId? (so we can track group?)
          // info to fire item's command/event?
          commandName: item.commandName,
          commandOptions: item.commandOptions,
        });

        setState(state => ({
          ...state,
          primary: !isAction ? { ...item, index } : state.primary,
          isExpanded: false,
          items: getSplitButtonItems(_items).filter(item =>
            isRadio && !isAction ? item.index !== index : true
          ),
        }));
      },
    }));

  const [state, setState] = useState({
    primary: _primary,
    items: getSplitButtonItems(_items).filter(item =>
      isRadio && !isAction ? item.id !== _primary.id : true
    ),
    isHovering: false,
    isExpanded: false,
  });

  const onSecondaryClickHandler = () =>
    setState(state => ({ ...state, isExpanded: !state.isExpanded }));
  const onMouseEnterHandler = () =>
    setState(state => ({ ...state, isHovering: true }));
  const onMouseLeaveHandler = () =>
    setState(state => ({ ...state, isHovering: false }));
  const outsideClickHandler = () =>
    setState(state => ({ ...state, isExpanded: false }));
  const onPrimaryClickHandler = () => {
    onInteraction({
      groupId,
      itemId: state.primary.id,
      interactionType: state.primary.type,
      // splitButtonId? (so we can track group?)
      // info to fire item's command/event?
      //
      commandName: state.primary.commandName,
      commandOptions: state.primary.commandOptions,
    });
  };

  const isPrimaryActive =
    (state.primary.type === 'tool' && primaryToolId === state.primary.id) ||
    (state.primary.type === 'toggle' && toggles[state.primary.id] === true);

  return (
    <OutsideClickHandler onOutsideClick={outsideClickHandler}>
      <div name="SplitButton" className="relative">
        <div
          className={classes.Button({
            ...state,
            primary: { isActive: isPrimaryActive },
          })}
          style={{ height: '40px' }}
          onMouseEnter={onMouseEnterHandler}
          onMouseLeave={onMouseLeaveHandler}
        >
          <div className={classes.Interface}>
            <div
              onClick={onPrimaryClickHandler}
              className={classes.Primary({
                ...state,
                primary: { isActive: isPrimaryActive },
              })}
              data-tool={state.primary.id}
              data-cy={`${groupId}-split-button-primary`}
            >
              <Tooltip
                isDisabled={!state.primary.tooltip}
                content={state.primary.tooltip}
              >
                <div
                  className="flex items-center justify-center w-full h-full"
                  style={{ padding: '10px' }}
                >
                  <Icon
                    name={state.primary.icon}
                    className={classes.PrimaryIcon({
                      ...state,
                      primary: { isActive: isPrimaryActive },
                    })}
                  />
                </div>
              </Tooltip>
            </div>
            <div
              className={classes.Separator({
                ...state,
                primary: { isActive: isPrimaryActive },
              })}
            ></div>
            <div
              className={classes.Secondary({
                ...state,
                primary: { isActive: isPrimaryActive },
              })}
              onClick={onSecondaryClickHandler}
              data-cy={`${groupId}-split-button-secondary`}
            >
              <Tooltip
                isDisabled={state.isExpanded || !secondary.tooltip}
                content={secondary.tooltip}
                className="h-full"
              >
                <Icon
                  name={secondary.icon}
                  className={classes.SecondaryIcon({
                    ...state,
                    primary: { isActive: isPrimaryActive },
                  })}
                />
              </Tooltip>
            </div>
          </div>
        </div>
        {/* EXPANDED LIST OF OPTIONS */}
        <div
          className={classes.Content({ ...state })}
          data-cy={`${groupId}-list-menu`}
        >
          <ListMenu items={state.items} renderer={renderer} />
        </div>
      </div>
    </OutsideClickHandler>
  );
};

const DefaultListItemRenderer = ({ icon, label, isActive }) => (
  <div
    className={classNames(
      'flex flex-row items-center p-3 h-8 w-full hover:bg-primary-dark',
      isActive && 'bg-primary-dark'
    )}
  >
    <span className="mr-4 text-base whitespace-pre text-common-bright">
      <Icon name={icon} className="w-5 h-5 text-common-bright" />
    </span>
    <span className="mr-5 text-base whitespace-pre text-common-bright">
      {label}
    </span>
  </div>
);

const noop = () => {};

SplitButton.defaultProps = {
  isRadio: false,
  isAction: false,
  primary: {
    label: null,
    tooltip: null,
  },
  secondary: {
    icon: 'chevron-down',
    label: null,
    isActive: true,
    tooltip: 'More Measure Tools',
  },
  items: [],
  renderer: DefaultListItemRenderer,
};

SplitButton.propTypes = {
  primary: PropTypes.shape({
    id: PropTypes.string.isRequired,
    icon: PropTypes.string,
    label: PropTypes.string,
    type: PropTypes.oneOf(['tool', 'action', 'toggle']).isRequired,
    tooltip: PropTypes.string,
  }),
  secondary: PropTypes.shape({
    id: PropTypes.string,
    icon: PropTypes.string,
    label: PropTypes.string,
    tooltip: PropTypes.string,
    isActive: PropTypes.bool,
  }),
  renderer: PropTypes.func,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.string,
      label: PropTypes.string,
      type: PropTypes.oneOf(['tool', 'action', 'toggle']).isRequired,
      tooltip: PropTypes.string,
      isActive: PropTypes.bool,
    })
  ),
  /** Callback function to inform ToolbarService of important events */
  onInteraction: PropTypes.func.isRequired,
};

export default SplitButton;
