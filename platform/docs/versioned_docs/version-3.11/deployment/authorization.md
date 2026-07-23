---
sidebar_position: 6
sidebar_label: Auth
title: Authorization and Authentication
summary: Guide to configuring OpenID-Connect authentication in OHIF Viewer, including setup of authorization flows, token handling, and implementation details for securing access to medical imaging data.
---

# Authorization and Authentication
The OHIF Viewer can be configured to work with authorization servers that support one or more of the OpenID-Connect authorization flows. The Viewer finds it's OpenID-Connect settings on the oidc configuration key. You can set these values in your configuration files. For instance you can take a look at our
`google.js` configuration file.


```js
oidc: [
  {
    // ~ REQUIRED
    authority: 'https://accounts.google.com',
    client_id: '723928408739-k9k9r3i44j32rhu69vlnibipmmk9i57p.apps.googleusercontent.com',
    redirect_uri: '/callback',
    response_type: 'id_token token',
    scope: 'email profile openid https://www.googleapis.com/auth/cloudplatformprojects.readonly https://www.googleapis.com/auth/cloud-healthcare', // email profile openid
    // ~ OPTIONAL
    post_logout_redirect_uri: '/logout-redirect.html',
    revoke_uri: 'https://accounts.google.com/o/oauth2/revoke?token=',
    automaticSilentRenew: true,
    revokeAccessTokenOnSignout: true,
  },
],
```

You need to provide the following information:
- authority: The URL of the authorization server.
- client_id: The client id of your application (provided by the authorization server).
- redirect_uri: The callback URL of your application.
- response_type: The response type of the authorization flow (e.g. id_token token, [learn more about different flows](https://darutk.medium.com/diagrams-of-all-the-openid-connect-flows-6968e3990660)).
- scope: The scopes that your application needs to access
- post_logout_redirect_uri: The URL that the user will be redirected to after logout.
- revoke_uri: The URL that the user will be redirected to after logout.
- automaticSilentRenew: If true, the user will be automatically logged in after the token expires.
- revokeAccessTokenOnSignout: If true, the access token will be revoked on logout.



## How it works
The Viewer uses the `userAuthenticationService` to set the OpenID-Connect settings. The `userAuthenticationService` is a singleton service that is responsible for authentication and authorization. It is initialized by the app and you can grab it
from the `servicesManager`

```js
const userAuthenticationService = servicesManager.services.userAuthenticationService;
```

Then the userAuthenticationService will inject the token as Authorization header in the requests that are sent to the server (both metadata
and pixelData).

## Token based authentication in URL
Sometimes (although not recommended), some servers like to send the token
in the query string. In this case, the viewer will automatically grab the token from the query string
and add it to the userAuthenticationService and remove it from the query string (to prevent it from being logged in the console
in future requests).

and example would be

```js
http://localhost:3000/viewer?StudyInstanceUIDs=1.2.3.4.5.6.6.7&token=e123125jsdfahsdf
```



## Implicit Flow vs Authorization Code Flow

The Viewer supports both the Implicit Flow and the Authorization Code Flow. The Implicit Flow is the default currently, as it is easier to set up and use. However, you can opt for better security by using the Authorization Code Flow. To do so, add `useAuthorizationCodeFlow` to the configuration and change the `response_type` from `id_token token` to `code`.

Read more about Implicit Flow vs Authorization Code Flow [here](https://documentation.openiddict.com/guides/choosing-the-right-flow.html#:~:text=The%20implicit%20flow%20is%20similar,when%20using%20response_mode%3Dform_post%20) and [here](https://medium.com/@alysachan830/the-basics-of-oauth-2-0-authorization-code-implicit-flow-state-and-pkce-ed95d3478e1c)

```js
oidc: [
  {
    authority: 'https://accounts.google.com',
    client_id: '723928408739-k9k9r3i44j32rhu69vlnibipmmk9i57p.apps.googleusercontent.com',
    redirect_uri: '/callback',
    scope: 'email profile openid',
    post_logout_redirect_uri: '/logout-redirect.html',
    revoke_uri: 'https://accounts.google.com/o/oauth2/revoke?token=',
    revokeAccessTokenOnSignout: true,
    automaticSilentRenew: true,
    // CHANGE THESE *****************************
    response_type: 'code',
    useAuthorizationCodeFlow: true,
  },
],
```

In fact, since browsers are blocking third-party cookies, the Implicit Flow will cease functioning in the future (not specific to OHIF). Read more [here](https://support.okta.com/help/s/article/FAQ-How-Blocking-Third-Party-Cookies-Can-Potentially-Impact-Your-Okta-Environment?language=en_US). It is recommended to use the Authorization Code Flow and begin migrating to it.

:::note
For the Authorization Code Flow, when authenticating against Google, you must add the `client_secret` to the configuration as well. Unfortunately, this seems to occur only with Google.
:::
