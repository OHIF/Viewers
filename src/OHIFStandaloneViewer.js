import React, { Component } from 'react';
import PropTypes from 'prop-types';
// import asyncComponent from './components/AsyncComponent.js'
import IHEInvokeImageDisplay from './routes/IHEInvokeImageDisplay.js';
import ViewerRouting from './routes/ViewerRouting.js';
import StudyListRouting from './studylist/StudyListRouting.js';
import StandaloneRouting from './routes/StandaloneRouting.js';
import CallbackPage from './CallbackPage.js';
import { withRouter } from 'react-router';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { ViewerbaseDragDropContext } from 'react-viewerbase';

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
  static propTypes = {
    history: PropTypes.object.isRequired,
    user: PropTypes.object,
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
          <Route exact path="/logout-redirect.html" onEnter={reload} />
          <Route
            path="/callback"
            render={() => <CallbackPage userManager={userManager} />}
          />
          <Route
            component={() => {
              userManager.signinRedirect();

              return null;
            }}
          />
        </Switch>
      );
    }

    return (
      <Switch>
        <Route exact path="/silent-refresh.html" onEnter={reload} />
        <Route exact path="/logout-redirect.html" onEnter={reload} />
        <Route exact path="/studylist" component={StudyListRouting} />
        <Route exact path="/" component={StudyListRouting} />
        <Route exact path="/viewer" component={StandaloneRouting} />
        <Route path="/viewer/:studyInstanceUids" component={ViewerRouting} />
        <Route
          path="/study/:studyInstanceUid/series/:seriesInstanceUids"
          component={ViewerRouting}
        />
        <Route
          path="/IHEInvokeImageDisplay"
          component={IHEInvokeImageDisplay}
        />
        <Route render={() => <div> Sorry, this page does not exist. </div>} />
      </Switch>
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
