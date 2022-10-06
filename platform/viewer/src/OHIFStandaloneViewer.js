import React, { Component, Fragment, Suspense } from 'react';
import PropTypes from 'prop-types';
import { withRouter, matchPath, Redirect } from 'react-router';
import { Route, Switch } from 'react-router-dom';
import { NProgress } from '@tanem/react-nprogress';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import {
  ViewerbaseDragDropContext,
  ErrorBoundary,
  asyncComponent,
  retryImport,
} from '@ohif/ui';
import { SignoutCallbackComponent } from 'redux-oidc';
import * as RoutesUtil from './routes/routesUtil';

import NotFound from './routes/NotFound.js';
import { Bar, Container } from './components/LoadingBar/';
import './OHIFStandaloneViewer.css';
import './variables.css';
import './theme-tide.css';
// Contexts
import AppContext from './context/AppContext';
import DashboardLayout from './layouts';
import { renderRoutes } from './routes';
import LoginPage from './pages/login';
import LoadingScreen from './components/LoadingScreen';
const ViewerRouting = asyncComponent(() =>
  retryImport(() =>
    import(/* webpackChunkName: "ViewerRouting" */ './routes/ViewerRouting.js')
  )
);

const RadionicRouting = asyncComponent(() =>
  retryImport(() =>
    import(
      /* webpackChunkName: "ViewerRouting" */ './routes/RadiomicsRouting.js'
    )
  )
);

const SelectMaskRouting = asyncComponent(() =>
  retryImport(() =>
    import(
      /* webpackChunkName: "ViewerRouting" */ './routes/SelectMaskRouting.js'
    )
  )
);

const CallbackPage = asyncComponent(() =>
  retryImport(() =>
    import(/* webpackChunkName: "CallbackPage" */ './routes/CallbackPage.js')
  )
);

const StudyListRouting = asyncComponent(() =>
  retryImport(() =>
    import(
      /* webpackChunkName: "StudyListRouting" */ './studylist/StudyListRouting.js'
    )
  )
);

const NnunetPage = asyncComponent(() =>
  retryImport(() =>
    import(
      /* webpackChunkName: "StudyListRouting" */ './routes/ViewerRouting2.js'
    )
  )
);

const SamplePage = asyncComponent(() =>
  retryImport(() =>
    import(/* webpackChunkName: "StudyListRouting" */ './pages/SamplePage.js')
  )
);

const UplouderPage = asyncComponent(() =>
  retryImport(() =>
    import(/* webpackChunkName: "StudyListRouting" */ './pages/Uplouder.js')
  )
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
          <Route path="/" render={() => <LoginPage />} />
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
    const routes = [
      {
        exact: true,
        path: '/404',
        component: SamplePage,
      },
      {
        exact: true,
        path: '/silent-refresh.html',
        onEnter: () => {
          RoutesUtil.reload();
        },
      },
      {
        exact: true,
        path: '/logout-refresh.html',
        onEnter: () => {
          RoutesUtil.reload();
        },
      },

      {
        exact: true,
        layout: DashboardLayout,
        path: '/uplouder',
        component: UplouderPage,
      },

      {
        exact: true,
        layout: DashboardLayout,
        path: '/studylist',

        component: StudyListRouting,
      },
      {
        exact: false,
        layout: DashboardLayout,

        path:
          '/studylist/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore',
        component: StudyListRouting,
      },

      {
        exact: false,
        layout: DashboardLayout,
        path: '/segmentation',
        component: SamplePage,
      },
      {
        exact: false,
        layout: DashboardLayout,
        path:
          '/view/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',
        component: ViewerRouting,
      },

      {
        exact: false,
        layout: DashboardLayout,
        path:
          '/edit/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',

        component: ViewerRouting,
      },
      {
        exact: false,
        layout: DashboardLayout,
        path:
          '/nnunet/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',
        component: NnunetPage,
      },
      {
        exact: false,
        layout: DashboardLayout,
        path:
          '/selectmask/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',
        component: SelectMaskRouting,
      },
      {
        exact: false,
        layout: DashboardLayout,
        path:
          '/radionics/:project/locations/:location/datasets/:dataset/dicomStores/:dicomStore/study/:studyInstanceUIDs',
        component: RadionicRouting,
      },

      {
        exact: true,
        layout: DashboardLayout,
        path: '/profile',
        component: SamplePage,
      },
      {
        path: '*',
        layout: DashboardLayout,
        routes: [
          {
            exact: true,
            path: '/',
            component: () => <Redirect to="/studylist" />,
          },
          {
            component: () => <Redirect to="/" />,
          },
        ],
      },
    ];

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

        <div className="App">
          <Suspense fallback={<LoadingScreen />}>
            <Switch>
              {routes.map((route, i) => {
                const Layout = route.layout || Fragment;
                const Component = route.component;

                return (
                  <Route
                    key={i}
                    path={route.path}
                    exact={route.exact}
                    render={props => (
                      <CSSTransition
                        in={props.match !== null}
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
                        <Layout>
                          {route.routes ? (
                            renderRoutes(route.routes)
                          ) : (
                            <ErrorBoundary context={props.match.url}>
                              <Component {...props} />
                            </ErrorBoundary>
                          )}
                        </Layout>
                      </CSSTransition>
                    )}
                  />
                );
              })}
            </Switch>
          </Suspense>
        </div>
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
