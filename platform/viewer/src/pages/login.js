import React from 'react';
import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import UserManagerContext from '../context/UserManagerContext';

function LoginPage({}) {
  const { appConfig } = useAppContext();
  const userManager = useContext(UserManagerContext);
  const location = useLocation();
  const handleLoginComponent = () => {
    const queryParams = new URLSearchParams(location.search);
    const iss = queryParams.get('iss');
    const loginHint = queryParams.get('login_hint');
    const targetLinkUri = queryParams.get('target_link_uri');
    // const oidcAuthority =
    //   appConfig.oidc !== null && appConfig.oidc[0].authority;
    // if (iss !== oidcAuthority) {
    //   console.error('iss of /login does not match the oidc authority');
    //   return null;
    // }

    userManager.removeUser().then(() => {
      if (targetLinkUri !== null) {
        const ohifRedirectTo = {
          pathname: new URL(targetLinkUri).pathname,
        };
        sessionStorage.setItem(
          'ohif-redirect-to',
          JSON.stringify(ohifRedirectTo)
        );
      } else {
        const ohifRedirectTo = {
          pathname: '/',
        };
        sessionStorage.setItem(
          'ohif-redirect-to',
          JSON.stringify(ohifRedirectTo)
        );
      }

      if (loginHint !== null) {
        userManager.signinRedirect({ login_hint: loginHint });
      } else {
        userManager.signinRedirect();
      }
    });

    return null;
  };

  return (
    <div
      className="App"
      style={{
        backgroundColor: '#fff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#000',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-around',
          minHeight: '80vh',
          color: '#000',
        }}
      >
        <div>
          <div>
            <h1
              style={{
                color: '#000',
                fontSize: '4.4rem',
              }}
            >
              RadCad
            </h1>
          </div>
          <div style={{}}>
            <h4
              style={{
                color: '#000',
                textAlign: 'center',
              }}
            >
              By CCIPD
            </h4>
          </div>
          <div>
            <h3
              style={{
                color: '#000',
                textAlign: 'center',
              }}
            >
              https://radcad.thetatech.ai{' '}
            </h3>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px',
            paddingRight: '100px',
            paddingLeft: '100px',
            borderRadius: '5px',
            border: '1px solid blue',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '120px',
              marginBottom: '20px',
              backgroundColor: 'grey',
            }}
          ></div>
          <button onClick={handleLoginComponent} className="primary-btn">
            login
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
