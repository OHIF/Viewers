import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import OutsideClickHandler from 'react-outside-click-handler';
import { useTranslation } from 'react-i18next';

import Icon from '../Icon';
import Tooltip from '../Tooltip';
import ListMenu from '../ListMenu';

const baseClasses = {
  Button: 'flex items-center rounded-md border-transparent group/button',
  Primary: 'h-full rounded-tl-md rounded-bl-md group/primary',
  Secondary:
    'h-full flex items-center justify-center rounded-tr-md rounded-br-md w-4 border-2 border-transparent group/secondary',
  SecondaryIcon: 'w-4 h-full stroke-1',
  Separator: 'border-l py-3 ml-0.5',
  Content: 'absolute z-10 top-0 mt-12',
};

const classes = {
  Button: ({ isExpanded }) =>
    classNames(
      baseClasses.Button,
      !isExpanded && 'hover:!bg-primary-dark hover:border-primary-dark'
    ),
  Interface: 'h-full flex flex-row items-center',
  Primary: ({ isExpanded, isActive }) =>
    classNames(
      baseClasses.Primary,
      isActive
        ? isExpanded
          ? 'border-primary-dark !bg-primary-dark hover:border-primary-dark !text-primary-light'
          : 'border-primary-light bg-primary-light rounded-md'
        : `focus:!text-black focus:!rounded-md focus:!border-primary-light focus:!bg-primary-light ${isExpanded ? 'border-primary-dark bg-primary-dark !text-primary-light' : 'border-secondary-dark bg-secondary-dark group-hover/button:border-primary-dark group-hover/button:text-primary-light hover:!bg-primary-dark hover:border-primary-dark focus:!text-black'}`
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
        : 'text-primary-active group-hover/secondary:text-primary-light'
    ),
  Separator: ({ primary, isExpanded, isHovering }) =>
    classNames(
      baseClasses.Separator,
      isHovering || isExpanded || primary.isActive ? 'border-transparent' : 'border-primary-active'
    ),
  Content: ({ isExpanded }) => classNames(baseClasses.Content, isExpanded ? 'block' : 'hidden'),
};

const DefaultListItemRenderer = props => {
  const { t, icon, label, className, isActive } = props;
  return (
    <div
      className={classNames(
        'flex h-8 w-full select-none flex-row items-center p-3',
        'whitespace-pre text-base',
        className,
        `${isActive ? 'hover:opacity-80' : 'hover:bg-primary-dark '}`
      )}
    >
      {icon && (
        <span className="mr-4">
          <Icon
            name={icon}
            className="h-[28px] w-[28px]"
          />
        </span>
      )}
      <span className="mr-5">{t?.(label)}</span>
    </div>
  );
};

/**
 * This is a more generic version of SplitButton without the isActive
 * and other interaction props
 */
const SplitButton = ({
  groupId,
  primary,
  secondary,
  items,
  renderer = null,
  onInteraction,
  Component = Icon,
}) => {
  const { t } = useTranslation('Buttons');
  const [state, setState] = useState({ isHovering: false, isExpanded: false });

  const toggleExpanded = () => setState({ ...state, isExpanded: !state.isExpanded });
  const setHover = hovering => setState({ ...state, isHovering: hovering });
  const collapse = () => setState({ ...state, isExpanded: false });

  const listItemRenderer = renderer || DefaultListItemRenderer;
  const primaryClassNames = classNames(
    classes.Primary({
      isExpanded: state.isExpanded,
      isActive: primary.isActive,
    }),
    primary.className
  );
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
          className={classes.Button({ ...state })}
          style={{ height: '40px' }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <div className={classes.Interface}>
            <div onClick={collapse}>
              <Component
                key={primary.id}
                {...primary}
                onInteraction={onInteraction}
                rounded="none"
                className={primaryClassNames}
                data-tool={primary.id}
                data-cy={`${groupId}-split-button-primary`}
              />
            </div>
            <div className={classes.Separator({ ...state, primary })}></div>
            <div
              className={classes.Secondary({ ...state, primary })}
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

SplitButton.propTypes = {
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

export default SplitButton;
