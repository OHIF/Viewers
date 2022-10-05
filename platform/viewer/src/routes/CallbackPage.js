import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CallbackComponent } from 'redux-oidc';

class CallbackPage extends Component {
  static propTypes = {
    userManager: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  };

  render() {
    return (
      <CallbackComponent
        userManager={this.props.userManager}
        successCallback={() => {
          const { pathname, search = '' } = JSON.parse(
            sessionStorage.getItem('ohif-redirect-to')
          );

          this.props.history.push({ pathname, search });
        }}
        errorCallback={error => {
          //this.props.history.push("/");
          throw new Error(error);
        }}
      >
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            backgroundColor: '#1a1c21',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <p style={{ color: 'white' }}>Redirecting...</p>
        </div>
      </CallbackComponent>
    );
  }
}

export default withRouter(CallbackPage);
