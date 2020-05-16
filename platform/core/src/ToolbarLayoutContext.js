import React, { Component, useContext } from 'react';

/// TODO MAKE THIS PRETTY DANNY

const ToolbarLayoutContext = React.createContext({
  toolBarLayout: [],
  setToolBarLayout: () => {},
});

ToolbarLayoutContext.displayName = 'ToolbarLayoutContext';

class ToolbarLayoutProvider extends Component {
  state = {
    toolBarLayout: [],
  };

  render() {
    const setToolBarLayout = toolBarLayout => {
      this.setState({ toolBarLayout });
    };

    return (
      <ToolbarLayoutContext.Provider
        value={{
          toolBarLayout: this.state.toolBarLayout,
          setToolBarLayout,
        }}
      >
        {this.props.children}
      </ToolbarLayoutContext.Provider>
    );
  }
}

const useToolbarLayout = () => useContext(ToolbarLayoutContext);

export default ToolbarLayoutContext;

export { ToolbarLayoutProvider, useToolbarLayout };
