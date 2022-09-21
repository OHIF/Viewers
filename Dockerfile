
# Stage 1: Build the application
# docker build -t ohif/viewer:latest .
FROM node:16.15.0-slim as json-copier

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

COPY ["package.json", "yarn.lock", "preinstall.js", "./"]
COPY extensions /usr/src/app/extensions
COPY modes /usr/src/app/modes
COPY platform /usr/src/app/platform

# Find and remove non-package.json files
#RUN find extensions \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf
#RUN find modes \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf
#RUN find platform \! -name "package.json" -mindepth 2 -maxdepth 2 -print | xargs rm -rf

# Copy Files
FROM node:16.15.0-slim as builder
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

COPY --from=json-copier /usr/src/app .

# Run the install before copying the rest of the files
RUN yarn config set workspaces-experimental true
RUN yarn install --frozen-lockfile --verbose

COPY . .

# To restore workspaces symlinks
RUN yarn install --frozen-lockfile --verbose

ENV PATH /usr/src/app/node_modules/.bin:$PATH
ENV QUICK_BUILD true

# Stage 3: Bundle the built application into a Docker container
# which runs Nginx using Alpine Linux
FROM nginx:1.15.5-alpine as final
RUN apk add --no-cache bash
RUN rm -rf /etc/nginx/conf.d
COPY .docker/Viewer-v2.x /etc/nginx/conf.d
