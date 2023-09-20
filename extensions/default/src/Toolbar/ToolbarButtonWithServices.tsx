import { ToolbarButton } from '@ohif/ui';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

function ToolbarSplitButtonWithServices({
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

  const isActive = type === 'tool' && id === primaryToolId;

  useEffect(() => {
    const { unsubscribe } = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      () => setButtonState({ ...toolbarService.state })
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

ToolbarSplitButtonWithServices.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['tool', 'action', 'toggle']).isRequired,
  commands: PropTypes.arrayOf(
    PropTypes.shape({
      command: PropTypes.string.isRequired,
      context: PropTypes.string,
    })
  ).isRequired,
  onInteraction: PropTypes.func.isRequired,
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      toolbarService: PropTypes.shape({
        subscribe: PropTypes.func.isRequired,
        state: PropTypes.shape({
          primaryToolId: PropTypes.string,
          toggles: PropTypes.objectOf(PropTypes.bool),
          groups: PropTypes.objectOf(PropTypes.object),
        }).isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

export default ToolbarSplitButtonWithServices;
