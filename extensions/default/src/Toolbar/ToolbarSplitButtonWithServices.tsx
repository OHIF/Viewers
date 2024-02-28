import { SplitButtonToolbar, ToolbarButton } from '@ohif/ui';
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
}) {
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
    <SplitButtonToolbar
      primary={primary}
      secondary={secondary}
      items={getSplitButtonItems(items)}
      isActive={primary.isActive}
      interactionType={primary.type}
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
