import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { ViewerbaseDragDropContext } from 'react-viewerbase';
import routes from './routes/';
import StudyListRouting from './studylist/StudyListRouting.js';
import CallbackPage from './CallbackPage.js';
import './App.css';
import './variables.css';
import './theme-tide.css';

const { ViewerRouting, StandaloneRouting, IHEInvokeImageDisplay } = routes;

const reload = () => window.location.reload();

function setContext(context) {
    /*Rollbar.configure({
        payload: {
            context
        }
    });*/
}

class App extends Component {
    static propTypes = {
        history: PropTypes.object.isRequired,
        user: PropTypes.object,
    }

    componentDidMount() {
        this.unlisten = this.props.history.listen((location, action) => {
            setContext(window.location.pathname);
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
              <Route path="/callback" render={
                () => <CallbackPage userManager={userManager}/>
              }/>
              <Route component={() => {
                userManager.signinRedirect();

                return null;
              }}/>
            </Switch>
          )
        }

        return (
            <Switch>
                <Route exact path="/silent-refresh.html" onEnter={reload} />
                <Route exact path="/logout-redirect.html" onEnter={reload} />
                <Route
                    exact
                    path="/studylist"
                    component={StudyListRouting}
                />
                <Route
                    exact
                    path="/"
                    component={StudyListRouting}
                />
                <Route
                    exact
                    path="/viewer"
                    component={StandaloneRouting}
                />
                <Route
                    path="/viewer/:studyInstanceUids"
                    component={ViewerRouting}
                />
                <Route
                    path="/study/:studyInstanceUid/series/:seriesInstanceUids"
                    component={ViewerRouting}
                />
                <Route
                    path="/IHEInvokeImageDisplay"
                    component={IHEInvokeImageDisplay}
                />
                <Route render={() =>
                    <div> Sorry, this page does not exist. </div>}
                />
            </Switch>
        );
    }
}

const mapStateToProps = state => {
    return {
        user: state.oidc.user,
    };
};

const ConnectedApp = connect(
    mapStateToProps,
    null
)(App);

export default ViewerbaseDragDropContext(withRouter(ConnectedApp));
