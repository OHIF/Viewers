# Nginx + Image Archive

> DISCLAIMER! We make no claims or guarantees of this approach's security. If in
> doubt, enlist the help of an expert and conduct proper audits.

At a certain point, you may want others to have access to your instance of the
OHIF Viewer and its medical imaging data. This post covers one of many potential
setups that accomplish that. Please note, noticably absent is user account
control.

Do not use this recipe to host sensitive medical data on the open web. Depending
on your company's policies, this may be an appropriate setup on an internal
network when protected with a server's basic authentication. For a more robust
setup, check out our [user account control recipe](./user-account-control.md)
that builds on the lessons learned here.

## Overview

Our two biggest hurdles when hosting our image archive and web client are:

- Risks related to exposing our PACS to the netowrk
- Cross-Origin Resource Sharing (CORS) requests

### Handling Web Requests

We mittigate our first issue by allowing [Nginx][nginx] to handle incoming web
requests. Nginx is open source software for web serving, reverse proxying,
caching, and more. It's designed for maximum performance and stability --
allowing us to more reliably serve content than Orthanc's built-in server can.

More specifically, we accomplish this by using a
[`reverse proxy`](https://en.wikipedia.org/wiki/Reverse_proxy) to retrieve
resources from our image archive (Orthanc), and when accessing its web admin.

> A reverse proxy is a type of proxy server that retrieves resources on behalf
> of a client from one or more servers. These resources are then returned to the
> client, appearing as if they originated from the proxy server itself.

### CORS Issues

Cross-Origin Resource Sharing (CORS) is a mechanism that uses HTTP headers to
tell a browser which web applications have permission to access selected
resources from a server at a different origin (domain, protocol, port). IE. By
default, a Web App located at `http://my-website.com` can't access resources
hosted at `http://not-my-website.com`

We can solve this one of two ways:

1. Have our Image Archive located at the same domain as our Web App
2. Add appropriate `Access-Control-Allow-*` HTTP headers

**This solution uses the first approach.**

You can read more about CORS in this Medium article: [Understanding
CORS][understanding-cors]

### Diagram

This setup allows us to create a setup similar to the one pictured below:

{% include "./../_nginx-image-archive-diagram.md" %}

- All web requests are routed through `nginx` on our `OpenResty` image
- `/pacs` is a reverse proxy for `orthanc`'s `DICOM Web` endpoints
- `/pacs-admin` is a reverse proxy for `orthanc`'s Web Admin
- All static resources for OHIF Viewer are served up by `nginx` when a matching
  route for that resource is requested

## Getting Started

### Requirements

- Docker
  - [Docker for Mac](https://docs.docker.com/docker-for-mac/)
  - [Docker for Windows](https://docs.docker.com/docker-for-windows/)

_Not sure if you have `docker` installed already? Try running `docker --version`
in command prompt or terminal_

### Setup

_Spin Things Up_

- Navigate to `<project-root>/docker/OpenResty-Orthanc` in your shell
- Run `docker-compose up`

_Upload Your First Study_

- Navigate to `http://127.0.0.1/pacs-admin`
- From the top right, select "Upload"
- Click "Select files to upload..." (DICOM)
- Click "Start the upload"
- Navigate back to `http://127.0.0.1/` to view your studies in the Study List

### Troubleshooting

_Exit code 137_

This means Docker ran out of memory. Open Docker Desktop, go to the `advanced`
tab, and increase the amount of Memory available.

_Cannot create container for service X_

Use this one with caution: `docker system prune`

_X is already running_

Stop running all containers:

- Win: `docker ps -a -q | ForEach { docker stop $_ }`
- Linux: `docker stop $(docker ps -a -q)`

### Configuration

After verifying that everything runs with default configuration values, you will
likely want to update:

- The domain: `http://127.0.0.1`

#### OHIF Viewer

The OHIF Viewer's configuration is imported from a static `.js` file. The
configuration we use is set to a specific file when we build the viewer, and
determined by the env variable: `APP_CONFIG`. You can see where we set its value
in the `dockerfile` for this solution:

`ENV APP_CONFIG=config/docker_openresty-orthanc.js`

You can find the configuration we're using here:
`/public/config/docker_openresty-orthanc.js`

To rebuild the `webapp` image created by our `dockerfile` after updating the
Viewer's configuration, you can run:

- `docker-compose build` OR
- `docker-compose up --build`

#### Other

All other files are found in: `/docker/OpenResty-Orthanc/`

| Service           | Configuration                     | Docs                                        |
| ----------------- | --------------------------------- | ------------------------------------------- |
| OHIF Viewer       | [dockerfile][dockerfile]          | You're reading them now!                    |
| OpenResty (Nginx) | [`/nginx.conf`][config-nginx]     | [lua-resty-openidc][lua-resty-openidc-docs] |
| Orthanc           | [`/orthanc.json`][config-orthanc] | [Here][orthanc-docs]                        |

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

### Adding SSL

Adding SSL registration and renewal for your domain with Let's Encrypt that
terminates at Nginx is an incredibly important step toward securing your data.
Here are some resources, specific to this setup, that may be helpful:

- [lua-resty-auto-ssl](https://github.com/GUI/lua-resty-auto-ssl)
- [Let's Encrypt + Nginx](https://www.nginx.com/blog/using-free-ssltls-certificates-from-lets-encrypt-with-nginx/)

While we terminate SSL at Nginx, it may be worth using self signed certificates
for communication between services.

- [SSL Termination for TCP Upstream Servers](https://docs.nginx.com/nginx/admin-guide/security-controls/terminating-ssl-tcp/)

### Use PostgresSQL w/ Orthanc

Orthanc can handle a large amount of data and requests, but if you find that
requests start to slow as you add more and more studies, you may want to
configure your Orthanc instance to use PostgresSQL. Instructions on how to do
that can be found in the
[`Orthanc Server Book`](http://book.orthanc-server.com/users/docker.html), under
"PostgreSQL and Orthanc inside Docker"

### Improving This Guide

Here are some improvements this guide would benefit from, and that we would be
more than happy to accept Pull Requests for:

- SSL Support
- Complete configuration with `.env` file (or something similar)
- Any security issues
- One-click deploy to a cloud provider

## Resources

### Misc. Helpful Commands

_Check if `nginx.conf` is valid:_

```bash
docker run --rm -t -a stdout --name my-openresty -v $PWD/config/:/usr/local/openresty/nginx/conf/:ro openresty/openresty:alpine-fat openresty -c /usr/local/openresty/nginx/conf/nginx.conf -t
```

_Interact w/ running container:_

`docker exec -it CONTAINER_NAME bash`

_List running containers:_

`docker ps`

### Referenced Articles

For more documentation on the software we've chosen to use, you may find the
following resources helpful:

- [Orthanc for Docker](http://book.orthanc-server.com/users/docker.html)
- [OpenResty Guide](http://www.staticshin.com/programming/definitely-an-open-resty-guide/)
- [Lua Ngx API](https://openresty-reference.readthedocs.io/en/latest/Lua_Nginx_API/)

For a different take on this setup, check out the repositories our community
members put together:

- [mjstealey/ohif-orthanc-dimse-docker](https://github.com/mjstealey/ohif-orthanc-dimse-docker)
- [trypag/ohif-orthanc-postgres-docker](https://github.com/trypag/ohif-orthanc-postgres-docker)

<!--
  Links
  -->

<!-- prettier-ignore-start -->
<!-- DOCS -->
[nginx]: https://www.nginx.com/resources/glossary/nginx/
[understanding-cors]: https://medium.com/@baphemot/understanding-cors-18ad6b478e2b
[orthanc-docs]: http://book.orthanc-server.com/users/configuration.html#configuration
[lua-resty-openidc-docs]: https://github.com/zmartzone/lua-resty-openidc
<!-- SRC -->
[dockerfile]: https://github.com/OHIF/Viewers/blob/master/platform/viewer/.recipes/OpenResty-Orthanc/dockerfile
[config-nginx]: https://github.com/OHIF/Viewers/blob/master/platform/viewer/.recipes/OpenResty-Orthanc/config/nginx.conf
[config-orthanc]: https://github.com/OHIF/Viewers/blob/master/platform/viewer/.recipes/OpenResty-Orthanc/config/orthanc.json
<!-- prettier-ignore-end -->
