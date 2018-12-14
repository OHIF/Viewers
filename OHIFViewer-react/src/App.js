import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { Route, Switch } from 'react-router-dom';
import { OHIF } from 'ohif-core';
import ViewerRouting from "./ViewerRouting.js";
import IHEInvokeImageDisplay from './IHEInvokeImageDisplay.js';
import './App.css';

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
        // Temporary until the rest of the UI is in React
        window.router = {
            history: this.props.history
        };
        
        this.unlisten = this.props.history.listen((location, action) => {
            setContext(window.location.pathname);
        });
    }

    componentWillUnmount() {
        this.unlisten();
    }

    render() {
        return (
            <Switch>
                <Route
                    exact
                    path="/studylist"
                    component={Studylist}
                    /*auth={this.props.auth}*/
                    store={this.props.store}
                />
                <Route
                    exact
                    path="/"
                    component={Studylist}
                    /*auth={this.props.auth}*/
                    store={this.props.store}
                />
                <Route
                    path="/viewer/:studyInstanceUids"
                    component={ViewerRouting}
                    /*auth={this.props.auth}*/
                    store={this.props.store}
                />
                <Route
                    path="/study/:studyInstanceUid/series/:seriesInstanceUids"
                    component={ViewerRouting}
                    /*auth={this.props.auth}*/
                    store={this.props.store}
                />
                <Route
                    path="/IHEInvokeImageDisplay"
                    component={IHEInvokeImageDisplay}
                    /*auth={this.props.auth}*/
                    store={this.props.store}
                />

                {/*<Route path="/silent-refresh.html" onEnter={reload} />
                <Route path="/logout-redirect.html" onEnter={reload} />*/}
                <Route render={() =>
                    <div> Sorry, this page does not exist. </div>}
                />
            </Switch>
        );
    }
}

export default withRouter(App);
