import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Route, Switch } from 'react-router-dom';
import SecretRoute from './SecretRoute.js';
import { OHIF } from 'meteor/ohif:core';
import Provider from "react-redux/es/components/Provider";

const reload = () => window.location.reload();
const Studylist = OHIF.studylist.components.StudyList;

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
        return (
            <Provider store={window.store}>
                <Switch>
                    <SecretRoute
                        exact
                        path="/studylist"
                        component={Studylist}
                        auth={this.props.auth}
                        store={this.props.store}
                    />
                    <SecretRoute
                        exact
                        path="/"
                        component={Studylist}
                        auth={this.props.auth}
                        store={this.props.store}
                    />
                    <SecretRoute
                        exact
                        path="/viewer"
                        component={ConnectedViewer}
                        auth={this.props.auth}
                        store={this.props.store}
                    />
                    {/*<Route path="/silent-refresh.html" onEnter={reload} />
                    <Route path="/logout-redirect.html" onEnter={reload} />*/}
                    <Route render={() =>
                        <div> Sorry, this page does not exist. </div>}
                    />
                </Switch>
            </Provider>
        );
    }
}

export default withRouter(App);
