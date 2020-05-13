import React, { Component } from 'react';

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

export default ViewModelContext;

export { ViewModelProvider };
