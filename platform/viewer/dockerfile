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
FROM node:11.2.0-slim as builder

# RUN apt-get update && apt-get install -y git yarn
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

ENV PATH /usr/src/app/node_modules/.bin:$PATH
ENV GENERATE_SOURCEMAP=false

COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock

ADD . /usr/src/app/
RUN yarn install
RUN yarn run build:web

# Stage 2: Bundle the built application into a Docker container
# which runs Nginx using Alpine Linux
FROM nginx:1.15.5-alpine
RUN rm -rf /etc/nginx/conf.d
COPY docker/Viewer-v2.x /etc/nginx/conf.d
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
