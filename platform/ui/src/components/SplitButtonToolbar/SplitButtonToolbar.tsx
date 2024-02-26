import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import OutsideClickHandler from 'react-outside-click-handler';
import { useTranslation } from 'react-i18next';

import Icon from '../Icon';
import Tooltip from '../Tooltip';
import ListMenu from '../ListMenu';

enum InteractionType {
  ACTION = 'action',
  TOOL = 'tool',
  TOGGLE = 'toggle',
}

const baseClasses = {
  Button: 'flex items-center rounded-md border-transparent cursor-pointer group/button',
  Primary:
    // By default border on left, top and bottom for hover effect and only rounded on left side.
    // Extra padding on right to compensate for no right border.
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
      !isExpanded && !primary.isActive && 'hover:!bg-primary-dark hover:border-primary-dark'
    ),
  Interface: 'h-full flex flex-row items-center',
  Primary: ({ isActive, isExpanded, isToggle, isTool }) =>
    classNames(baseClasses.Primary, {
      'border-primary-dark !bg-primary-dark hover:border-primary-dark !text-primary-light':
        isActive && isExpanded,
      'border-primary-light bg-primary-light border-2 rounded-md !p-2':
        isActive && !isToggle && !isExpanded,
      'border-secondary-dark && border-2 rounded-md !p-2': isActive && isToggle && !isExpanded,
      'border-primary-dark bg-primary-dark !text-primary-light': !isActive && isExpanded,
      'border-secondary-dark bg-secondary-dark group-hover/button:border-primary-dark group-hover/button:text-primary-light hover:!bg-primary-dark hover:border-primary-dark focus:!text-black':
        !isActive && !isExpanded,
    }),
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
      isExpanded ? 'text-primary-dark' : 'text-[#348cfd] group-hover/secondary:text-primary-light'
    ),
  Separator: ({ primary, isExpanded, isHovering }) =>
    classNames(
      baseClasses.Separator,
      isHovering || isExpanded || primary.isActive ? 'border-transparent' : 'border-primary-active'
    ),
  Content: ({ isExpanded }) => classNames(baseClasses.Content, isExpanded ? 'block' : 'hidden'),
};

const SplitButtonToolbar = ({
  groupId,
  primary,
  secondary,
  items,
  renderer,
  onInteraction,
  Component,
  isActive,
}) => {
  const { t } = useTranslation('Buttons');
  const [state, setState] = useState({ isHovering: false, isExpanded: false });

  const toggleExpanded = () => setState({ ...state, isExpanded: !state.isExpanded });
  const setHover = hovering => setState({ ...state, isHovering: hovering });
  const collapse = () => setState({ ...state, isExpanded: false });

  const isToggle = primary.type === InteractionType.TOGGLE;
  const isAction = primary.type === InteractionType.ACTION;
  const isTool = primary.type === InteractionType.TOOL;

  const DefaultListItemRenderer = ({ type, icon, label, t, isActive }) => {
    const itemIsToggleAndActive = type === InteractionType.TOGGLE && isActive;

    return (
      <div
        className={classNames(
          'hover:bg-primary-dark flex h-8 w-full flex-row items-center p-3',
          'whitespace-pre text-base',
          {
            'bg-primary-dark hover:bg-primary-dark hover:text-primary-light text-[#348CFD] text-[#348CFD]':
              itemIsToggleAndActive,
          }
        )}
      >
        {icon && (
          <span className="mr-4">
            <Icon
              name={icon}
              className="h-5 w-5"
            />
          </span>
        )}
        <span className="mr-5">{t(label)}</span>
      </div>
    );
  };

  const listItemRenderer = renderer || DefaultListItemRenderer;

  return (
    <OutsideClickHandler
      onOutsideClick={collapse}
      disabled={!state.isExpanded}
    >
      <div
        id="SplitButton"
        className="relative"
      >
        <div
          className={classes.Button({ ...state, primary: { isActive } })}
          style={{ height: '40px' }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <div className={classes.Interface}>
            <div onClick={collapse}>
              <Component
                key={primary.id}
                {...primary}
                isActive={isActive}
                onInteraction={onInteraction}
                rounded="none"
                className={classes.Primary({
                  isActive,
                  isExpanded: state.isExpanded,
                  isToggle,
                  isAction,
                  isTool,
                })}
                data-tool={primary.id}
                data-cy={`${groupId}-split-button-primary`}
              />
            </div>
            <div className={classes.Separator({ ...state, primary: { isActive } })}></div>
            <div
              className={classes.Secondary({ ...state, primary: { isActive } })}
              onClick={toggleExpanded}
              data-cy={`${groupId}-split-button-secondary`}
            >
              <Tooltip
                isDisabled={state.isExpanded || !secondary.tooltip}
                content={secondary.tooltip}
                className="h-full"
              >
                <Icon
                  name={secondary.icon}
                  className={classes.SecondaryIcon({ ...state })}
                />
              </Tooltip>
            </div>
          </div>
        </div>
        <div
          className={classes.Content({ ...state })}
          data-cy={`${groupId}-list-menu`}
        >
          <ListMenu
            items={items}
            onClick={collapse}
            renderer={args => listItemRenderer({ ...args, t })}
          />
        </div>
      </div>
    </OutsideClickHandler>
  );
};

SplitButtonToolbar.propTypes = {
  isToggle: PropTypes.bool,
  groupId: PropTypes.string.isRequired,
  primary: PropTypes.object.isRequired,
  secondary: PropTypes.object.isRequired,
  items: PropTypes.array.isRequired,
  renderer: PropTypes.func,
  isActive: PropTypes.bool,
  onInteraction: PropTypes.func.isRequired,
  Component: PropTypes.elementType,
  interactionType: PropTypes.oneOf(['action', 'tool', 'toggle']),
};

SplitButtonToolbar.defaultProps = {
  isToggle: false,
  renderer: null,
  isActive: false,
  Component: null,
};

export default SplitButtonToolbar;
