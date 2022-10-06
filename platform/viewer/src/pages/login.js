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
        backgroundColor: 'var(--ui-gray-darker)',
        minHeight: '100vh',
        display: 'flex',
        // flexDirection: 'column',
        // alignItems: 'center',
        // justifyContent: 'center',
        color: '#fff',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          position: 'fixed',
          alignItems: 'center',
          top: 0,
          left: 0,
          padding: '16px 16px 16px 15px',
          flexDirection: 'row',
          zIndex: 9,
        }}
      >
        <div
          style={{
            color: '#fff',
            // flex: 1,
          }}
        >
          <div
            style={{
              fontweight: '400',
              marginLeft: '45px',
              fontSize: '22px',
              paddingTop: '6px',
              paddingBottom: '6px',
              paddingLeft: '18px',
              paddingRight: '18px',
              display: 'flex',
              border: '1px #878787 solid',
              borderRadius: '4px',
              flexDirection: 'row',
              letterSpacing: '-0.05em',
              lineHeight: '31px',
            }}
          >
            <h4>Thetatech</h4>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          // margin: '20px',
          // minHeight: '80vh',
        }}
      >
        {/* <div
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

        <div>
          <div>
            <h1
              style={{
                fontSize: '4.4rem',
              }}
            >
              RadCad
            </h1>
          </div>
        </div> */}
      </div>

      <div
        style={{
          flex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-around',
          // minHeight: '100vh',
          backgroundColor: 'black',
          borderRadius: '10px',
          // padding: '80px',
          margin: '20px',
          color: '#fff',
        }}
      >
        <div>
          <div>
            <h1
              style={{
                color: '#fff',
                fontSize: '4.4rem',
              }}
            >
              Login
            </h1>
          </div>
        </div>

        <button
          onClick={handleLoginComponent}
          className="btn btn-primary"
          style={{
            width: '80%',
            fontweight: 'bold',
          }}
        >
          login
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
