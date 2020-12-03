import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter, matchPath } from 'react-router';
import { Route, Switch } from 'react-router-dom';
import { NProgress } from '@tanem/react-nprogress';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import { ViewerbaseDragDropContext, ErrorBoundary, asyncComponent, retryImport } from '@ohif/ui';
import { SignoutCallbackComponent } from 'redux-oidc';
import * as RoutesUtil from './routes/routesUtil';

import NotFound from './routes/NotFound.js';
import { Bar, Container } from './components/LoadingBar/';
import './OHIFStandaloneViewer.css';
import './variables.css';
import './theme-tide.css';
// Contexts
import AppContext from './context/AppContext';
const CallbackPage = asyncComponent(() =>
  retryImport(() => import(/* webpackChunkName: "CallbackPage" */ './routes/CallbackPage.js'))
);

class OHIFStandaloneViewer extends Component {
  static contextType = AppContext;
  state = {
    isLoading: false,
  };

  static propTypes = {
    history: PropTypes.object.isRequired,
    user: PropTypes.object,
    setContext: PropTypes.func,
    userManager: PropTypes.object,
    location: PropTypes.object,
  };

  componentDidMount() {
    this.unlisten = this.props.history.listen((location, action) => {
      if (this.props.setContext) {
        this.props.setContext(window.location.pathname);
      }
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    const { user, userManager } = this.props;
    const { appConfig = {} } = this.context;
    const userNotLoggedIn = userManager && (!user || user.expired);
    if (userNotLoggedIn) {
      const { pathname, search } = this.props.location;

      if (pathname !== '/callback') {
        sessionStorage.setItem(
          'ohif-redirect-to',
          JSON.stringify({ pathname, search })
        );
      }

      return (
        <Switch>
          <Route
            exact
            path="/silent-refresh.html"
            onEnter={RoutesUtil.reload}
          />
          <Route
            exact
            path="/logout-redirect"
            render={() => (
              <SignoutCallbackComponent
                userManager={userManager}
                successCallback={() => console.log('Signout successful')}
                errorCallback={error => {
                  console.warn(error);
                  console.warn('Signout failed');
                }}
              />
            )}
          />
          <Route
            path="/callback"
            render={() => <CallbackPage userManager={userManager} />}
          />
          <Route
            path="/login"
            component={() => {
              const queryParams = new URLSearchParams(
                this.props.location.search
              );
              const iss = queryParams.get('iss');
              const loginHint = queryParams.get('login_hint');
              const targetLinkUri = queryParams.get('target_link_uri');
              const oidcAuthority =
                appConfig.oidc !== null && appConfig.oidc[0].authority;
              if (iss !== oidcAuthority) {
                console.error(
                  'iss of /login does not match the oidc authority'
                );
                return null;
              }

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
            }}
          />
          <Route
            component={() => {
              userManager.getUser().then(user => {
                if (user) {
                  userManager.signinSilent();
                } else {
                  userManager.signinRedirect();
                }
              });

              return null;
            }}
          />
        </Switch>
      );
    }

    /**
     * Note: this approach for routing is caused by the conflict between
     * react-transition-group and react-router's <Switch> component.
     *
     * See http://reactcommunity.org/react-transition-group/with-react-router/
     */
    const routes = RoutesUtil.getRoutes(appConfig);

    const currentPath = this.props.location.pathname;
    const noMatchingRoutes = !routes.find(r =>
      matchPath(currentPath, {
        path: r.path,
        exact: true,
      })
    );

    return (
      <>
        <NProgress isAnimating={this.state.isLoading}>
          {({ isFinished, progress, animationDuration }) => (
            <Container
              isFinished={isFinished}
              animationDuration={animationDuration}
            >
              <Bar progress={progress} animationDuration={animationDuration} />
            </Container>
          )}
        </NProgress>
        <Route exact path="/silent-refresh.html" onEnter={RoutesUtil.reload} />
        <Route exact path="/logout-redirect.html" onEnter={RoutesUtil.reload} />
        {!noMatchingRoutes &&
          routes.map(({ path, Component }) => (
            <Route key={path} exact path={path}>
              {({ match }) => (
                <CSSTransition
                  in={match !== null}
                  timeout={300}
                  classNames="fade"
                  unmountOnExit
                  onEnter={() => {
                    this.setState({
                      isLoading: true,
                    });
                  }}
                  onEntered={() => {
                    this.setState({
                      isLoading: false,
                    });
                  }}
                >
                  {match === null ? (
                    <></>
                  ) : (
                      <ErrorBoundary context={match.url}>
                        <Component match={match} location={this.props.location} />
                      </ErrorBoundary>
                    )}
                </CSSTransition>
              )}
            </Route>
          ))}
        {noMatchingRoutes && <NotFound />}
      </>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
  };
};

const ConnectedOHIFStandaloneViewer = connect(
  mapStateToProps,
  null
)(OHIFStandaloneViewer);

export default ViewerbaseDragDropContext(
  withRouter(ConnectedOHIFStandaloneViewer)
);
