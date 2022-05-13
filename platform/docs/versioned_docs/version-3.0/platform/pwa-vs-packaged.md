---
sidebar_position: 3
---

# PWA vs Packaged

It's important to know that the OHIF Viewer project provides two different build
processes:

```bash
# Static Asset output: For deploying PWAs
yarn run build
```

## Progressive Web Application (PWA)

> [Progressive Web Apps][pwa] are a new breed of web applications that meet the
> [following requirements][pwa-checklist]. Notably, targeting a PWA allows us
> provide a reliable, fast, and engaging experience across different devices and
> network conditions.

The OHIF Viewer is maintained as a [monorepo][monorepo]. We use WebPack to build
the many small static assets that comprise our application. Also generated is an
`index.html` that will serve as an entry point for loading configuration and the
application, as well as a `service-worker` that can intelligently cache files so
that subsequent requests are from the local file system instead of over the
network.

You can read more about this particular strategy in our
[Build for Production Deployment Guide](./../deployment/build-for-production.md)

## Commonjs Bundle (Packaged Script)

We are not supporting `Commonjs` bundling inside `OHIF-v3`.
