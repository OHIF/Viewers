import React from "react";
import { CallbackComponent } from "redux-oidc";
import { withRouter } from "react-router-dom";
import userManager from "./userManager";

class CallbackPage extends React.Component {
    render() {
        // just redirect to '/' in both cases
        return (
            <CallbackComponent
                userManager={userManager}
                successCallback={() => this.props.history.push("/")}
                errorCallback={error => {
                    this.props.history.push("/");
                    console.error(error);
                }}
            >
                <div>Redirecting...</div>
            </CallbackComponent>
        );
    }
}

export default withRouter(CallbackPage);
