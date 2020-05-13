import React, { Component } from 'react';

const ViewModelContext = React.createContext({
  displaySetInstanceUids: [],
  setDisplaySetInstanceUids: () => {},
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

    return (
      <ViewModelContext.Provider
        value={{
          displaySetInstanceUids: this.state.displaySetInstanceUids,
          setDisplaySetInstanceUids,
        }}
      >
        {this.props.children}
      </ViewModelContext.Provider>
    );
  }
}

export default ViewModelContext;

export { ViewModelProvider };
