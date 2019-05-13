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
setup, check out our [user account control recpie](./user-account-control.md)
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

This solution uses the first approach, but you can see an example of the second
in the `docker-compose` bundled with this project for local development:
[HERE](#)

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
