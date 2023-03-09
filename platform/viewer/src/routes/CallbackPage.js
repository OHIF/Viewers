import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CallbackComponent } from 'redux-oidc';
import { radcadapi } from '../utils/constants';

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

          localStorage.setItem('warmupStatus', JSON.stringify(0));

          const state = window.store.getState();
          console.log({ oidc: state.oidc });

          var requestOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + state.oidc.user.access_token,
            },
          };

          fetch(radcadapi + '/endpoint-warmup', requestOptions)
            .then(data => {
              console.log(data);
            })
            .catch(err => {
              console.log(err);
            });
          // const response = await axios.post(radcadapi, {}, config);
          // this.props.history.push({ pathname, search });
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
