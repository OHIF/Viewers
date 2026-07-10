# syntax=docker/dockerfile:1.7-labs
# This dockerfile is used to publish the `ohif/app` image on dockerhub.
#
# It's a good example of how to build our static application and package it
# with a web server capable of hosting it as static content.
#
# docker build
# --------------
# If you would like to use this dockerfile to build and tag an image, make sure
# you set the context to the project's root directory:
# https://docs.docker.com/engine/reference/commandline/build/
#
#
# SUMMARY
# --------------
# This dockerfile has two stages:
#
# 1. Building the React application for production
# 2. Setting up our Nginx (Alpine Linux) image w/ step one's output
#


# Stage 1: Build the application
# docker build -t ohif/viewer:latest .
# Copy Files
FROM node:24.15.0-slim as builder

RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@11

RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

# Copy package manifests for install caching. preinstall.js is included because
# the root package.json's "preinstall" lifecycle script (node preinstall.js)
# runs during `pnpm install` below -- before the full source is copied -- so the
# script file must already be present or install fails with MODULE_NOT_FOUND.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc preinstall.js ./
COPY --parents ./extensions/*/package.json ./modes/*/package.json ./platform/*/package.json ./
# Run the install before copying the rest of the files.
# Keep --no-frozen-lockfile here (unlike CI): .dockerignore excludes
# platform/docs, so the lockfile's docs importer has no manifest in the build
# context and a frozen install would fail. pnpm reconciles (drops docs) instead.
RUN pnpm install --no-frozen-lockfile
# Copy the local directory
COPY --link --exclude=pnpm-lock.yaml --exclude=package.json --exclude=Dockerfile . .

# Build here
# After install it should hopefully be stable until the local directory changes
ENV QUICK_BUILD true
# ENV GENERATE_SOURCEMAP=false
ARG APP_CONFIG=config/default.js
ARG PUBLIC_URL=/
ENV PUBLIC_URL=${PUBLIC_URL}

RUN pnpm run show:config
RUN pnpm run build

# Precompress files
RUN chmod u+x .docker/compressDist.sh
RUN ./.docker/compressDist.sh

# Stage 2: Bundle the built application into a Docker container
# which runs Nginx using Alpine Linux
FROM nginxinc/nginx-unprivileged:1.27-alpine as final
#RUN apk add --no-cache bash
ARG PUBLIC_URL=/
ENV PUBLIC_URL=${PUBLIC_URL}
ARG PORT=80
ENV PORT=${PORT}
RUN rm /etc/nginx/conf.d/default.conf
USER nginx
COPY --chown=nginx:nginx .docker/Viewer-v3.x /usr/src
RUN chmod 777 /usr/src/entrypoint.sh
COPY --from=builder /usr/src/app/platform/app/dist /usr/share/nginx/html${PUBLIC_URL}
# Copy paths that are renamed/redirected generally
# Microscopy libraries depend on root level include, so must be copied
COPY --from=builder /usr/src/app/platform/app/dist/dicom-microscopy-viewer /usr/share/nginx/html/dicom-microscopy-viewer

# In entrypoint.sh, app-config.js might be overwritten, so chmod it to be writeable.
# The nginx user cannot chmod it, so change to root.
USER root
RUN mkdir -p /usr/share/nginx/html${PUBLIC_URL}plugins \
  && chown -R nginx:nginx /usr/share/nginx/html && chmod -R 777 /usr/share/nginx/html
USER nginx
ENTRYPOINT ["/usr/src/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
