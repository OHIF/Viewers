

## Build





### Host name mapping

For this setup to work as expected, please add the following entries to your `/etc/hosts` file:

```
127.0.0.1 keycloak
```

### Steps that need to be done before running the compose

rename docker_nginx-orthanc-keycloak.js to default.js then do yarn build

### Steps after the compose is built

Visit keycloak dashboard: http://keycloak:8080/
Go to OHIF realm, then OHIF client, then regenerate the client secret and copy it.
Add the client secret to oauth2-proxy.cfg to replace the existing one.

If you need users to test this out, please create users in the realm accordingly.
