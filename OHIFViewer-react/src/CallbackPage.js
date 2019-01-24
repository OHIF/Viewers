import React, { Component } from "react";
import { CallbackComponent } from "redux-oidc";
import { withRouter } from "react-router-dom";
import PropTypes from 'prop-types';

class CallbackPage extends Component {
  static propTypes = {
    userManager: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
  }

  render() {
    return (
      <CallbackComponent
        userManager={this.props.userManager}
        successCallback={() => {
          this.props.history.push("/");
        }}
        errorCallback={error => {
          //this.props.history.push("/");
          throw new Error(error);
        }}
      >
        <div>Redirecting...</div>
      </CallbackComponent>
    );
  }
}

export default withRouter(CallbackPage);
