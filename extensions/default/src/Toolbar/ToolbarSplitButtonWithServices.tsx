import { SplitButton, Icon, ToolbarButton } from '@ohif/ui';
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function ToolbarSplitButtonWithServices({
  groupId,
  primary,
  secondary,
  items,
  renderer,
  onInteraction,
  servicesManager,
}) {
  const { toolbarService } = servicesManager?.services;

  /* Bubbles up individual item clicks */
  const getSplitButtonItems = useCallback(
    items =>
      items.map((item, index) => ({
        ...item,
        index,
        onClick: () => {
          const { id, type, commands } = item;
          onInteraction({
            groupId,
            itemId: id,
            interactionType: type,
            commands,
          });
        },
      })),
    []
  );

  const DefaultListItemRenderer = ({ icon, label, t, id }) => {
    return (
      <div
        className={classNames(
          'hover:bg-primary-dark flex h-8 w-full flex-row items-center p-3',
          'whitespace-pre text-base'
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

  const PrimaryButtonComponent =
    toolbarService?.getButtonComponentForUIType(primary.uiType) ?? ToolbarButton;

  const listItemRenderer = renderer || DefaultListItemRenderer;

  return (
    <SplitButton
      isActive={false}
      primary={primary}
      secondary={secondary}
      items={items}
      groupId={groupId}
      renderer={listItemRenderer}
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
