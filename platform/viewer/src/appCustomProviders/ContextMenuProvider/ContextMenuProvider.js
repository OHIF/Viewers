import React from 'react';
import PropTypes from 'prop-types';
import { ContextMenuProvider } from '@ohif/ui';

const CustomContextMenuProvider = ({
  children,
  service,
  contextMenuComponent,
  commandsManager,
}) => {
  const onDeleteHandler = (nearbyToolData, eventData) => {
    const element = eventData.element;
    commandsManager.runCommand('removeToolState', {
      element,
      toolType: nearbyToolData.toolType,
      tool: nearbyToolData.tool,
    });
  };

  return (
    <ContextMenuProvider
      service={service}
      contextMenuComponent={contextMenuComponent}
      onDelete={onDeleteHandler}
    >
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
  contextMenuComponent: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.func,
  ]).isRequired,
  commandsManager: PropTypes.object.isRequired,
};

export default CustomContextMenuProvider;
