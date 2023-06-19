import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import OutsideClickHandler from 'react-outside-click-handler';
import { useTranslation } from 'react-i18next';

import Icon from '../Icon';
import Tooltip from '../Tooltip';
import ListMenu from '../ListMenu';
import ToolbarButton from '../ToolbarButton';

const baseClasses = {
  Button:
    'flex items-center rounded-md border-transparent cursor-pointer group/button',
  Primary:
    // By default border on left, top and bottom for hover effect and only rounded on left side.
    // Extra padding on right to componensate for no right border.
    'h-full border-l-2 border-t-2 border-b-2 rounded-tl-md rounded-bl-md group/primary !pl-2 !py-2',
  Secondary:
    'h-full flex items-center justify-center rounded-tr-md rounded-br-md w-4 border-2 border-transparent group/secondary',
  SecondaryIcon: 'w-4 h-full stroke-1',
  Separator: 'border-l py-2.5',
  Content: 'absolute z-10 top-0 mt-12',
};

const classes = {
  Button: ({ isExpanded, primary }) =>
    classNames(
      baseClasses.Button,
      !isExpanded &&
        !primary.isActive &&
        'hover:!bg-primary-dark hover:border-primary-dark'
    ),
  Interface: 'h-full flex flex-row items-center',
  Primary: ({ primary, isExpanded }) =>
    classNames(
      baseClasses.Primary,
      primary.isActive
        ? isExpanded
          ? 'border-primary-dark !bg-primary-dark hover:border-primary-dark !text-primary-light'
          : `${
              primary.isToggle
                ? 'border-secondary-dark bg-secondary-light'
                : 'border-primary-light bg-primary-light'
            }
            border-2 rounded-md !p-2` // Full, rounded border with less right padding when active.
        : `focus:!text-black focus:!rounded-md focus:!border-primary-light focus:!bg-primary-light
        ${
          isExpanded
            ? 'border-primary-dark bg-primary-dark !text-primary-light'
            : 'border-secondary-dark bg-secondary-dark group-hover/button:border-primary-dark group-hover/button:text-primary-light hover:!bg-primary-dark hover:border-primary-dark focus:!text-black'
        }
        `
    ),
  Secondary: ({ isExpanded, primary }) =>
    classNames(
      baseClasses.Secondary,
      isExpanded
        ? 'bg-primary-light !rounded-tr-md !rounded-br-md'
        : primary.isActive
        ? 'bg-secondary-dark'
        : 'hover:bg-primary-dark bg-secondary-dark group-hover/button:border-primary-dark'
    ),
  SecondaryIcon: ({ isExpanded }) =>
    classNames(
      baseClasses.SecondaryIcon,
      isExpanded
        ? 'text-primary-dark'
        : 'text-[#348cfd] group-hover/secondary:text-primary-light'
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
  servicesManager,
}) => {
  const { t } = useTranslation('Buttons');

  const { toolbarService } = servicesManager?.services || {};

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
          commands: item.commands,
        });

        setState(state => ({
          ...state,
          primary: !isAction && isRadio ? { ...item, index } : state.primary,
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

  const isPrimaryToggle = state.primary.type === 'toggle';
  const isPrimaryActive =
    (state.primary.type === 'tool' && primaryToolId === state.primary.id) ||
    (isPrimaryToggle && toggles[state.primary.id] === true);

  const PrimaryButtonComponent =
    toolbarService?.getButtonComponentForUIType(state.primary.uiType) ??
    ToolbarButton;

  const primaryButtonClassName = classes.Primary({
    ...state,
    primary: { isActive: isPrimaryActive, isToggle: isPrimaryToggle },
  });

  const DefaultListItemRenderer = ({ type, icon, label, t, id }) => {
    const isActive = type === 'toggle' && toggles[id] === true;

    return (
      <div
        className={classNames(
          'flex flex-row items-center p-3 h-8 w-full hover:bg-primary-dark',
          'text-base whitespace-pre',
          isActive && 'bg-primary-dark',
          isActive
            ? 'text-[#348CFD]'
            : 'text-common-bright hover:bg-primary-dark hover:text-primary-light'
        )}
      >
        {icon && (
          <span className="mr-4">
            <Icon name={icon} className="w-5 h-5" />
          </span>
        )}
        <span className="mr-5">{t(label)}</span>
      </div>
    );
  };

  const listItemRenderer = renderer || DefaultListItemRenderer;

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
            <div onClick={outsideClickHandler}>
              <PrimaryButtonComponent
                key={state.primary.id}
                {...state.primary}
                bState={bState}
                isActive={isPrimaryActive}
                onInteraction={args => toolbarService.recordInteraction(args)}
                servicesManager={servicesManager}
                // All rounding is taken care of by className
                rounded="none"
                className={primaryButtonClassName}
                data-tool={state.primary.id}
                data-cy={`${groupId}-split-button-primary`}
              />
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
          <ListMenu
            items={state.items}
            bState={bState}
            renderer={args => listItemRenderer({ ...args, t })}
          />
        </div>
      </div>
    </OutsideClickHandler>
  );
};

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
  renderer: null,
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
  /** Callback function to inform toolbarService of important events */
  onInteraction: PropTypes.func.isRequired,
};

export default SplitButton;
