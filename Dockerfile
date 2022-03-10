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
FROM node:14-slim as builder

RUN mkdir /app
WORKDIR /app

# Copy Files
COPY .docker /app/.docker
COPY .webpack /app/.webpack
COPY extensions /app/extensions
COPY platform /app/platform
COPY .browserslistrc /app/.browserslistrc
COPY aliases.config.js /app/aliases.config.js
COPY babel.config.js /app/babel.config.js
COPY lerna.json /app/lerna.json
COPY package.json /app/package.json
COPY postcss.config.js /app/postcss.config.js
COPY yarn.lock /app/yarn.lock

RUN apt-get update && apt-get install -y python3.9 make g++
# Run the install before copying the rest of the files
RUN yarn config set workspaces-experimental true
RUN yarn install --frozen-lockfile

ENV PATH /app/node_modules/.bin:$PATH
ENV QUICK_BUILD true
# ENV GENERATE_SOURCEMAP=false
# ENV REACT_APP_CONFIG=config/default.js

RUN yarn run build

# Stage 2: Bundle the built application into a Docker container
# which runs Nginx using Alpine Linux
FROM nginx:alpine
RUN apk add --no-cache bash

# Delete existing Nginx configuration file
RUN rm -rf /etc/nginx/conf.d

# Copy Nginx configuration file and entrypoint script
COPY .docker/Viewer-v2.x /etc/nginx/conf.d
COPY .docker/Viewer-v2.x/entrypoint.sh /usr/src/

# Copy built Viewer code from build stage into the container
COPY --from=builder /app/platform/viewer/dist /usr/share/nginx/html

# Expose ports 80 and 443
EXPOSE 80
EXPOSE 443

# Change permissions of the entrypoint script and set it as entry point
RUN chmod 777 /usr/src/entrypoint.sh
ENTRYPOINT ["/usr/src/entrypoint.sh"]

# Start Nginx daemon service
CMD ["nginx", "-g", "daemon off;"]
