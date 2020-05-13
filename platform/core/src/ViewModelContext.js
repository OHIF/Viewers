import React, { Component, useContext } from 'react';

/// TODO MAKE THIS PRETTY DANNY

const ViewModelContext = React.createContext({
  displaySetInstanceUids: [],
  setDisplaySetInstanceUids: () => {},
  toolBarLayout: [],
  setToolBarLayout: () => {},
});

ViewModelContext.displayName = 'ViewModelContext';

class ViewModelProvider extends Component {
  state = {
    displaySetInstanceUids: [],
  };

  render() {
    const setDisplaySetInstanceUids = displaySetInstanceUids => {
      this.setState({ displaySetInstanceUids });
    };

    const setToolBarLayout = toolBarLayout => {
      this.setState({ toolBarLayout });
    };

    return (
      <ViewModelContext.Provider
        value={{
          displaySetInstanceUids: this.state.displaySetInstanceUids,
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
