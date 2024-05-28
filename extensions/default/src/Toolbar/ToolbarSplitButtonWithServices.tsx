import { SplitButton, ToolbarButton } from '@ohif/ui';
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

function ToolbarSplitButtonWithServices({
  groupId,
  primary,
  secondary,
  items,
  renderer,
  onInteraction,
  servicesManager,
}: withAppTypes) {
  const { toolbarService } = servicesManager?.services;

  /* Bubbles up individual item clicks */
  const getSplitButtonItems = useCallback(
    items =>
      items.map((item, index) => ({
        ...item,
        index,
        onClick: () => {
          onInteraction({
            groupId,
            itemId: item.id,
            commands: item.commands,
          });
        },
      })),
    []
  );

  const PrimaryButtonComponent =
    toolbarService?.getButtonComponentForUIType(primary.uiType) ?? ToolbarButton;

  const listItemRenderer = renderer;

  return (
    <SplitButton
      primary={primary}
      secondary={secondary}
      items={getSplitButtonItems(items)}
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
  groupId: PropTypes.string,
  primary: PropTypes.shape({
    id: PropTypes.string.isRequired,
    uiType: PropTypes.string,
  }),
  secondary: PropTypes.shape({
    id: PropTypes.string,
    icon: PropTypes.string.isRequired,
    label: PropTypes.string,
    tooltip: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    className: PropTypes.string,
  }),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      icon: PropTypes.string,
      label: PropTypes.string,
      tooltip: PropTypes.string,
      disabled: PropTypes.bool,
      className: PropTypes.string,
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

export default ToolbarSplitButtonWithServices;
