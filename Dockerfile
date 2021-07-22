# This dockerfile is used to publish the `ohif/viewer` image on dockerhub.
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
FROM node:15.13.0-slim as builder

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# Copy Files
COPY .docker /usr/src/app/.docker
COPY .webpack /usr/src/app/.webpack
COPY extensions /usr/src/app/extensions
COPY platform /usr/src/app/platform
COPY .browserslistrc /usr/src/app/.browserslistrc
COPY aliases.config.js /usr/src/app/aliases.config.js
COPY babel.config.js /usr/src/app/babel.config.js
COPY lerna.json /usr/src/app/lerna.json
COPY package.json /usr/src/app/package.json
COPY postcss.config.js /usr/src/app/postcss.config.js
COPY yarn.lock /usr/src/app/yarn.lock

RUN apt-get update && apt-get install -y python make g++
# Run the install before copying the rest of the files
RUN yarn config set workspaces-experimental true
RUN yarn install

ENV PATH /usr/src/app/node_modules/.bin:$PATH
ENV QUICK_BUILD true
# ENV GENERATE_SOURCEMAP=false
# ENV REACT_APP_CONFIG=config/default.js

RUN yarn run build

# Stage 2: Bundle the built application into a Docker container
# which runs Nginx using Alpine Linux
FROM nginx:1.15.5-alpine
RUN apk add --no-cache bash
RUN rm -rf /etc/nginx/conf.d
COPY .docker/Viewer-v2.x /etc/nginx/conf.d
COPY .docker/Viewer-v2.x/entrypoint.sh /usr/src/
RUN chmod 777 /usr/src/entrypoint.sh
COPY --from=builder /usr/src/app/platform/viewer/dist /usr/share/nginx/html
EXPOSE 80
EXPOSE 443
ENTRYPOINT ["/usr/src/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
