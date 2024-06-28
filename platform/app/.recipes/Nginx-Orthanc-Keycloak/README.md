

## Updating the OHIF config

rename docker_nginx-orthanc-keycloak.js to default.js then change:

```
wadoUriRoot: 'http://YOUR_DOMAIN_OR_IP/pacs',
qidoRoot: 'http://YOUR_DOMAIN_OR_IP/pacs',
wadoRoot: 'http://YOUR_DOMAIN_OR_IP/pacs',
```

### Build the compose

```bash
docker compose build
```


### Start the compose

```bash
docker compose up
```

### Disabling HTTPs for Keycloak (not recommended)

To disable HTTPs if needed, run the following commands in order on the host machine

```
docker exec -it {keycloak_container} /bin/bash
```
```
cd /opt/keycloak/bin
```
```
./kcadm.sh config credentials --server http://YOUR_DOMAIN_OR_IP/keycloak/ --realm master --user admin
```
Enter the admin password when prompted above, then execute the following command to disable SSL
```
./kcadm.sh update realms/master -s sslRequired=NONE
```

### Adjusting the callback URLs to your actual IP/Domain

visit the keycloak dashboard at http://YOUR_DOMAIN_OR_IP/keycloak and login with:

- Admin: `admin / admin`

From the realms menu, choose OHIF, then clients, then ohif-viewer, update the following fields:

```
Root URL: http://YOUR_DOMAIN_OR_IP
Home URL: http://YOUR_DOMAIN_OR_IP
Valid redirect URIs: http://YOUR_DOMAIN_OR_IP/oauth2/callback
Web origins: http://YOUR_DOMAIN_OR_IP
Admin URL: http://YOUR_DOMAIN_OR_IP
```



### Visiting the viewer

OHIF viewer is available at the root path: http://YOUR_DOMAIN_OR_IP or http://YOUR_DOMAIN_OR_IP/ohif-viewer

Predefined users:

- Viewer: `viewer / viewer`
- Pacs Admin: `pacsadmin / pacsadmin`


### Temporiary volume rendering without HTTPS

In your chrome browser, enter the following url chrome://flags/#unsafely-treat-insecure-origin-as-secure

Set the value to enabled, and in the text box add:

http://YOUR_DOMAIN_OR_IP

press save and restart the browser.


### Local Domain

If you are running this on your machine for testing purposes, the default domain to replace the values with is 127.0.0.1
