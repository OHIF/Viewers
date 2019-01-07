import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { ViewerbaseDragDropContext } from 'react-viewerbase';
import ViewerRouting from "./ViewerRouting.js";
import StudyListRouting from './StudyListRouting.js';
import StandaloneRouting from './StandaloneRouting.js';
import IHEInvokeImageDisplay from './IHEInvokeImageDisplay.js';
import CallbackPage from './CallbackPage.js';
import userManager from "./userManager.js";
import './App.css';
import './variables.css';
import './theme-tide.css';

const reload = () => window.location.reload();

function setContext(context) {
    /*Rollbar.configure({
        payload: {
            context
        }
    });*/
    console.log(context);
}

class App extends Component {
    componentDidMount() {
        this.unlisten = this.props.history.listen((location, action) => {
            setContext(window.location.pathname);
        });
    }

    componentWillUnmount() {
        this.unlisten();
    }

    render() {
        const user = this.props.user;

        if (!user || user.expired) {
            // TODO: redirect to OAuth page if necessary
            //return ('Loading user...');
        }

        return (
            <Switch>
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

                <Route path="/silent-refresh.html" onEnter={reload} />
                <Route path="/logout-redirect.html" onEnter={reload} />
                <Route exact path='/login' component={() => {
                        userManager.signinRedirect();
                }}
                />
                <Route path="/callback" component={CallbackPage} />
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
