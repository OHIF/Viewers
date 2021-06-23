import React from "react";
import { Route } from "react-router-dom";
import { useUserAuthentication } from "@ohif/ui";

export const PrivateRoute = ({ ...rest }) => {
    const [{ user, enabled }, userAuthenticationService] = useUserAuthentication();

    if (enabled && !user) {
      return userAuthenticationService.handleUnauthenticated();
    }

    return <Route {...rest}/>;
}

export default PrivateRoute;
