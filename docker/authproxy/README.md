# Guide

Build docker container using:

- Build: `docker build -t authproxy .`
- Tag: `docker tag authproxy:latest authproxy:staging`

> Start your docker container, and volume mount the directory containing the
> `nginx-keycloak.conf` configuration file. We also mount the current directory
> under `/usr/share/nginx/html` so any html files in the current directory will
> be hosted behind the authenticating proxy. Finally, we mapped port 80 on the
> host to port 80 in the container.

`docker run -d -it -p 80:80 -v $PWD/:/config -v /:/usr/share/nginx/html authproxy -c /config/nginx.conf`
docker run -d -it -p 80:80 -v /:/config -v /:/usr/share/nginx/html authproxy -c
/config/nginx-keycloak.conf

## Orthanc

- Configuration
  - http://book.orthanc-server.com/users/configuration.html#configuration

## Keycloak

### Setup

Library we use to manage OpenID-Connect `implicit` flow:
https://github.com/maxmantz/redux-oidc

- Set admin user/pass in `docker-compose`
- What are realms?
- Configure Clients
  - Create client
    - ClientID: `pacs`; save
  - Details page
    - Client Protocol: `openid-connect`
    - AccessType: `Confidential`
    - Picking a grant type:
      https://auth0.com/docs/api-auth/which-oauth-flow-to-use
      - Standard Flow: `off`
      - Implicit Flow: `on`
      - Direct Access: `off`
    - Root URL: `http://127.0.0.1`
    - Valid Redirect URIs: `/studylist/*`
    - Web Origins: `*`
  - Credentials Tab
    - Copy `secret`
- Manage: Users
  - Add User
    - Username: `test`
  - Credentials Tab
    - Password: `test`

## Useful Commands

List containers: `docker ps`

Stop running all containers:

- Win: `docker ps -a -q | ForEach { docker stop $_ }`
- Linux: `docker stop $(docker ps -a -q)`

Interact w/ running container:

`docker exec -it CONTAINER_NAME bash`

## Resources

- http://www.staticshin.com/programming/definitely-an-open-resty-guide/#access_by_lua

## TODO

- Add build step for `authproxy` to docker-compose script
