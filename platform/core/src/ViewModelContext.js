import React, { Component, useContext } from 'react';

/// TODO MAKE THIS PRETTY DANNY

const ViewModelContext = React.createContext({
  displaySetInstanceUIDs: [],
  setDisplaySetInstanceUIDs: () => {},
});

ViewModelContext.displayName = 'ViewModelContext';

class ViewModelProvider extends Component {
  state = {
    displaySetInstanceUIDs: [],
  };

  render() {
    const setDisplaySetInstanceUIDs = displaySetInstanceUIDs => {
      this.setState({ displaySetInstanceUIDs });
    };

    return (
      <ViewModelContext.Provider
        value={{
          displaySetInstanceUIDs: this.state.displaySetInstanceUIDs,
          setDisplaySetInstanceUIDs,
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
