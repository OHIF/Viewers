import React, { Component, useContext } from 'react';

/// TODO MAKE THIS PRETTY DANNY

const ViewModelContext = React.createContext({
  displaySetInstanceUIDs: [],
  setDisplaySetInstanceUids: () => {},
  toolBarLayout: [],
  setToolBarLayout: () => {},
});

ViewModelContext.displayName = 'ViewModelContext';

class ViewModelProvider extends Component {
  state = {
    displaySetInstanceUIDs: [],
  };

  render() {
    const setDisplaySetInstanceUids = displaySetInstanceUIDs => {
      this.setState({ displaySetInstanceUIDs });
    };

    const setToolBarLayout = toolBarLayout => {
      this.setState({ toolBarLayout });
    };

    return (
      <ViewModelContext.Provider
        value={{
          displaySetInstanceUIDs: this.state.displaySetInstanceUIDs,
          setDisplaySetInstanceUids,
          toolBarLayout: this.state.toolBarLayout,
          setToolBarLayout,
        }}
      >
        {this.props.children}
      </ViewModelContext.Provider>
    );
  }
}

const useViewModel = () => useContext(ViewModelContext);

export default ViewModelContext;

export { ViewModelProvider, useViewModel };
