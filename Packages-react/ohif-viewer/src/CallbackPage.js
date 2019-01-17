import React, { Component } from "react";
import { CallbackComponent } from "redux-oidc";
import { withRouter } from "react-router-dom";
import PropTypes from 'prop-types';
import userManager from "./userManager";

class CallbackPage extends Component {
    static propTypes = {
        history: PropTypes.object
    }

    render() {
        // just redirect to '/' in both cases
        return (
            <CallbackComponent
                userManager={userManager}
                successCallback={() => this.props.history.push("/")}
                errorCallback={error => {
                    this.props.history.push("/");
                    throw new Error(error);
                }}
            >
                <div>Redirecting...</div>
            </CallbackComponent>
        );
    }
}

export default withRouter(CallbackPage);
