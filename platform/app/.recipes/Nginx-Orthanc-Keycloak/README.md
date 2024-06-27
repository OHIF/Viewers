

## Steps before building the compose

rename docker_nginx-orthanc-keycloak.js to default.js then do yarn build

### Build the compose

```bash
docker-compose build
```

### Start the compose

```bash
docker-compose up
```

OHIF viewer is available at the root path: http://127.0.0.1 or http://127.0.0.1/ohif-viewer

Predefined users:

- Viewer: `viewer / viewer`
- Pacs Admin: `pacsadmin / pacsadmin`

If you need to add additional users, visit the keycloak dashboard at http://127.0.0.1/keycloak and login with:

- Admin: `admin / admin`
