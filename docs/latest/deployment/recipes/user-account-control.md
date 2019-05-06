# User Account Control

> DISCLAIMER! We make no claims or guarantees of this approach's security. If in
> doubt, enlist the help of an expert and conduct proper audits.

Making a viewer and its medical imaging data accessible on the open web can
provide a lot of benefits, but requires additional security to make sure
sensitive information can only be viewed by authorized individuals. Most image
archives are equipped with basic security measures, but they are not
robust/secure enough for the open web.

This guide covers one of many potential production setups that secure our
sensitive data.

## Overview

This guide builds on top of our
[Nginx + Orthanc guide](/deployment/recipes/nginx--image-archive.md), wherein we
used a [`reverse proxy`](https://en.wikipedia.org/wiki/Reverse_proxy) to
retrieve resources from our image archive (Orthanc).

To add support for "User Account Control" we introduce
[Keycloak](https://www.keycloak.org/about.html). Keycloak is an open source
Identity and Access Management solution that makes it easy to secure
applications and services with little to no code. We improve upon our
`reverse proxy` setup by integrating Keycloak and Nginx to create an
`authenticating reverse proxy`.

> An authenticating reverse proxy is a reverse proxy that only retrieves the
> resources on behalf of a client if the client has been authenticated. If a
> client is not authenticated they can be redirected to a login page.

This setup allows us to...

> https://www.nginx.com/blog/authenticating-users-existing-applications-openid-connect-nginx-plus/

_Keycloak validates user identity using OAuth 2.0 and OpenID Connect for
Google-based SSO_

## Requirements

- Docker
  - [Docker for Mac](https://docs.docker.com/docker-for-mac/)
  - [Docker for Windows](https://docs.docker.com/docker-for-windows/)

_Not sure if you have `docker` installed already? Try running `docker --version`
in command prompt or terminal_

## Getting Started

...

## How it works

_reverse proxy_

A reverse proxy is a type of proxy server that retrieves resources on behalf of
a client from one or more servers. The resources from these servers are returned
to the client as if they originate from the Web server itself.

[OpenResty](https://openresty.org/en/)

> OpenResty® is a full-fledged web platform that integrates the standard Nginx
> core, LuaJIT, many carefully written Lua libraries, lots of high quality
> 3rd-party Nginx modules, and most of their external dependencies. It is
> designed to help developers easily build scalable web applications, web
> services, and dynamic web gateways.

[Lua Nginx Module](https://github.com/openresty/lua-nginx-module)
[access_by_lua_block](https://github.com/openresty/lua-nginx-module#access_by_lua_block)

## Next Steps

### Deploying to Production

While these configuration and docker-compose files model an environment suitable
for production, they are not easy to deploy "as is". You can either:

- Manually recreate this environment and deploy built application files **OR**
- Deploy to a cloud kubernetes provider like
  [Digital Ocean](https://www.digitalocean.com/products/kubernetes/) **OR**
  - [See a full list of cloud providers here](https://landscape.cncf.io/category=cloud&format=card-mode&grouping=category)
- Find and follow your preferred provider's guide on setting up
  [swarms and stacks](https://docs.docker.com/get-started/)

## Resources

The inspiration for our setup was driven largely by these articles:

- [Securing Nginx with Keycloak](https://edhull.co.uk/blog/2018-06-06/keycloak-nginx)
- [Authenticating Reverse Proxy with Keycloak](https://eclipsesource.com/blogs/2018/01/11/authenticating-reverse-proxy-with-keycloak/)
- [Securing APIs with Kong and Keycloak](https://www.jerney.io/secure-apis-kong-keycloak-1/)

For more documentation on the software we've chosen to use, you may find the
following resources helpful:

- [Orthanc for Docker](http://book.orthanc-server.com/users/docker.html)
- [OpenResty Guide](http://www.staticshin.com/programming/definitely-an-open-resty-guide/)
- [Lua Ngx API](https://openresty-reference.readthedocs.io/en/latest/Lua_Nginx_API/)
