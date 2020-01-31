import React from 'react';

export default function withCommandsManager(Component, commandsManager = {}) {
  return class WithCommandsManager extends React.Component {
    render() {
      return (
        <Component
          {...this.props}
          onScroll={viewportIndex =>
            commandsManager.runCommand('getVtkApiForViewportIndex', {
              index: viewportIndex,
            })
          }
        />
      );
    }
  };
}
