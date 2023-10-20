import { ToolbarButton } from '@ohif/ui';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function ToolbarButtonWithServices({
  id,
  type,
  commands,
  onInteraction,
  servicesManager,
  ...props
}) {
  const { toolbarService } = servicesManager?.services || {};

  const [buttonsState, setButtonState] = useState({
    primaryToolId: '',
    toggles: {},
    groups: {},
  });
  const { primaryToolId } = buttonsState;

  const isActive =
    (type === 'tool' && id === primaryToolId) ||
    (type === 'toggle' && buttonsState.toggles[id] === true);

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

  return (
    <ToolbarButton
      commands={commands}
      id={id}
      type={type}
      isActive={isActive}
      onInteraction={onInteraction}
      {...props}
    />
  );
}

ToolbarButtonWithServices.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['tool', 'action', 'toggle']).isRequired,
  commands: PropTypes.arrayOf(
    PropTypes.shape({
      commandName: PropTypes.string.isRequired,
      context: PropTypes.string,
    })
  ),
  onInteraction: PropTypes.func.isRequired,
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      toolbarService: PropTypes.shape({
        subscribe: PropTypes.func.isRequired,
        state: PropTypes.shape({
          primaryToolId: PropTypes.string,
          toggles: PropTypes.objectOf(PropTypes.bool),
          groups: PropTypes.objectOf(PropTypes.any),
        }).isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

export default ToolbarButtonWithServices;
