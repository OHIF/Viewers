import React from 'react';
import PropTypes from 'prop-types';
import { ContextMenuProvider } from '@ohif/ui';

const CustomContextMenuProvider = ({ children, service, commandsManager }) => {
  const onDeleteHandler = (nearbyToolData, eventData) => {
    const element = eventData.element;
    commandsManager.runCommand('removeToolState', {
      element,
      toolType: nearbyToolData.toolType,
      tool: nearbyToolData.tool,
    });
  };

  return (
    <ContextMenuProvider service={service} onDelete={onDeleteHandler}>
      {children}
    </ContextMenuProvider>
  );
};

CustomContextMenuProvider.defaultProps = {
  service: null,
};

CustomContextMenuProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }),
  commandsManager: PropTypes.object.isRequired,
};

export default CustomContextMenuProvider;
