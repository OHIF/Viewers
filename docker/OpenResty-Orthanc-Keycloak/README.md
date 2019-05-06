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

## Useful Commands

List containers: `docker ps`

Stop running all containers:

- Win: `docker ps -a -q | ForEach { docker stop $_ }`
- Linux: `docker stop $(docker ps -a -q)`

Interact w/ running container:

`docker exec -it CONTAINER_NAME bash`

To delete containers not in use: `docker prune`

Test nginx.conf:

`docker run --rm -t -a stdout --name my-openresty -v $PWD/config/:/usr/local/openresty/nginx/conf/:ro openresty/openresty:alpine-fat openresty -c /usr/local/openresty/nginx/conf/nginx.conf -t`

## Resources

- http://www.staticshin.com/programming/definitely-an-open-resty-guide/#access_by_lua

## TODO

- Add build step for `authproxy` to docker-compose script
