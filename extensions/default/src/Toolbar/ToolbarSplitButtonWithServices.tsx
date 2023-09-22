import { SplitButton, Icon, ToolbarButton } from '@ohif/ui';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function ToolbarSplitButtonWithServices({
  isRadio,
  isAction,
  groupId,
  primary,
  secondary,
  items,
  renderer,
  onInteraction,
  servicesManager,
}) {
  const { toolbarService } = servicesManager?.services;

  const handleItemClick = (item, index) => {
    const { id, type, commands } = item;
    onInteraction({
      groupId,
      itemId: id,
      interactionType: type,
      commands,
    });

    setState(state => ({
      ...state,
      primary: !isAction && isRadio ? { ...item, index } : state.primary,
      isExpanded: false,
      items: getSplitButtonItems(items).filter(item =>
        isRadio && !isAction ? item.index !== index : true
      ),
    }));
  };

  /* Bubbles up individual item clicks */
  const getSplitButtonItems = items =>
    items.map((item, index) => ({
      ...item,
      index,
      onClick: () => handleItemClick(item, index),
    }));

  const [buttonsState, setButtonState] = useState({
    primaryToolId: '',
    toggles: {},
    groups: {},
  });

  const [state, setState] = useState({
    primary,
    items: getSplitButtonItems(items).filter(item =>
      isRadio && !isAction ? item.id !== primary.id : true
    ),
  });

  const { primaryToolId, toggles } = buttonsState;

  const isPrimaryToggle = state.primary.type === 'toggle';

  const isPrimaryActive =
    (state.primary.type === 'tool' && primaryToolId === state.primary.id) ||
    (isPrimaryToggle && toggles[state.primary.id] === true);

  const PrimaryButtonComponent =
    toolbarService?.getButtonComponentForUIType(state.primary.uiType) ?? ToolbarButton;

  useEffect(() => {
    const { unsubscribe } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      state => {
        setButtonState({ ...state });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [toolbarService]);

  const updatedItems = state.items.map(item => {
    const isActive = item.type === 'tool' && primaryToolId === item.id;

    // We could have added the
    // item.type === 'toggle' && toggles[item.id] === true
    // too but that makes the button active when the toggle is active under it
    // which feels weird
    return {
      ...item,
      isActive,
    };
  });

  const DefaultListItemRenderer = ({ type, icon, label, t, id }) => {
    const isActive = type === 'toggle' && toggles[id] === true;

    return (
      <div
        className={classNames(
          'hover:bg-primary-dark flex h-8 w-full flex-row items-center p-3',
          'whitespace-pre text-base',
          isActive && 'bg-primary-dark',
          isActive
            ? 'text-[#348CFD]'
            : 'text-common-bright hover:bg-primary-dark hover:text-primary-light'
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
    <SplitButton
      isRadio={isRadio}
      isAction={isAction}
      primary={state.primary}
      secondary={secondary}
      items={updatedItems}
      groupId={groupId}
      renderer={listItemRenderer}
      isActive={isPrimaryActive || updatedItems.some(item => item.isActive)}
      isToggle={isPrimaryToggle}
      onInteraction={onInteraction}
      Component={props => (
        <PrimaryButtonComponent
          {...props}
          servicesManager={servicesManager}
        />
      )}
    />
  );
}

ToolbarSplitButtonWithServices.propTypes = {
  isRadio: PropTypes.bool,
  isAction: PropTypes.bool,
  groupId: PropTypes.string,
  primary: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['tool', 'action', 'toggle']).isRequired,
    uiType: PropTypes.string,
  }),
  secondary: PropTypes.shape({
    id: PropTypes.string,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string,
    tooltip: PropTypes.string.isRequired,
    isActive: PropTypes.bool,
  }),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['tool', 'action', 'toggle']).isRequired,
      icon: PropTypes.string,
      label: PropTypes.string,
      tooltip: PropTypes.string,
    })
  ),
  renderer: PropTypes.func,
  onInteraction: PropTypes.func.isRequired,
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      toolbarService: PropTypes.object,
    }),
  }),
};

ToolbarSplitButtonWithServices.defaultProps = {
  isRadio: false,
  isAction: false,
};

export default ToolbarSplitButtonWithServices;
