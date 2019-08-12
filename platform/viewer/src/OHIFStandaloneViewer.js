import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter, matchPath } from 'react-router';
import { Route, Switch } from 'react-router-dom';
import { NProgress } from '@tanem/react-nprogress';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import { ViewerbaseDragDropContext } from '@ohif/ui';
import { SignoutCallbackComponent } from 'redux-oidc';
// import asyncComponent from './components/AsyncComponent.js'
import IHEInvokeImageDisplay from './routes/IHEInvokeImageDisplay.js';
import ViewerRouting from './routes/ViewerRouting.js';
import ViewerLocalFileData from './connectedComponents/ViewerLocalFileData.js';
import StudyListRouting from './studylist/StudyListRouting.js';
import StandaloneRouting from './routes/StandaloneRouting.js';
import CallbackPage from './routes/CallbackPage.js';
import NotFound from './routes/NotFound.js';
import { Bar, Container } from './components/LoadingBar/';
import './OHIFStandaloneViewer.css';
import './variables.css';
import './theme-tide.css';

// Dynamic Import Routes (CodeSplitting)
// const IHEInvokeImageDisplay = asyncComponent(() =>
//   import('./routes/IHEInvokeImageDisplay.js')
// )
// const ViewerRouting = asyncComponent(() => import('./routes/ViewerRouting.js'))
// const StudyListRouting = asyncComponent(() =>
//   import('./studylist/StudyListRouting.js')
// )
// const StandaloneRouting = asyncComponent(() =>
//   import('./routes/StandaloneRouting.js')
// )
// const CallbackPage = asyncComponent(() => import('./CallbackPage.js'))
//

const reload = () => window.location.reload();

class OHIFStandaloneViewer extends Component {
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
      const pathname = this.props.location.pathname;

      if (pathname !== '/callback') {
        sessionStorage.setItem('ohif-redirect-to', pathname);
      }

      return (
        <Switch>
          <Route exact path="/silent-refresh.html" onEnter={reload} />
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
        path: '/local',
        Component: ViewerLocalFileData,
      },
      {
        path: '/viewer',
        Component: StandaloneRouting,
      },
      {
        path: '/viewer/:studyInstanceUids',
        Component: ViewerRouting,
      },
      {
        path: '/study/:studyInstanceUids/series/:seriesInstanceUids',
        Component: ViewerRouting,
      },
      {
        path: '/IHEInvokeImageDisplay',
        Component: IHEInvokeImageDisplay,
      },
    ];

    const showStudyList =
      window.config && window.config.showStudyList !== undefined
        ? window.config.showStudyList
        : true;
    if (showStudyList) {
      routes.push({
        path: '/studylist',
        Component: StudyListRouting,
      });
      routes.push({
        path: '/',
        Component: StudyListRouting,
      });
    }

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
        <Route exact path="/silent-refresh.html" onEnter={reload} />
        <Route exact path="/logout-redirect.html" onEnter={reload} />
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
                    this.setState({ isLoading: true });
                  }}
                  onEntered={() => {
                    this.setState({ isLoading: false });
                  }}
                >
                  {match === null ? (
                    <></>
                  ) : (
                    <Component match={match} location={this.props.location} />
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
