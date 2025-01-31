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
# 2. Setting up our Nginx (Amazon Linux) image w/ step one's output
#


# Stage 1: Build the application
# docker build -t ohif/viewer:latest .
FROM 707767160287.dkr.ecr.us-east-1.amazonaws.com/gen3/amazonlinux-base:master AS json-copier

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
FROM 707767160287.dkr.ecr.us-east-1.amazonaws.com/gen3/amazonlinux-base:master AS builder

RUN yum update -y && \
  yum groupinstall "Development Tools" -y && \
  yum install -y gcc-c++ make && \
  curl -sL https://rpm.nodesource.com/setup_18.x | bash - && \
  yum install -y nodejs-18.16.1 && \
  npm install -g yarn

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

COPY --from=json-copier /usr/src/app .

# Run the install before copying the rest of the files
RUN yarn config set workspaces-experimental true
RUN yarn install --frozen-lockfile --verbose

COPY . .

# To restore workspaces symlinks
RUN yarn install --frozen-lockfile --verbose

ENV PATH=/usr/src/app/node_modules/.bin:$PATH
ENV QUICK_BUILD=true
ENV PUBLIC_URL=/ohif-viewer/
# ENV GENERATE_SOURCEMAP=false
# ENV REACT_APP_CONFIG=config/default.js

RUN yarn run build

# Stage 3: Bundle the built application into a Docker container
# which runs Nginx built on top of Amazon Linux

FROM quay.io/cdis/python-nginx-al:master AS final
#RUN apk add --no-cache bash
ENV PORT=8080
USER gen3
COPY --chown=gen3:gen3 .docker/Viewer-v3.x /usr/src
RUN chmod 777 /usr/src/entrypoint.sh
COPY --from=builder /usr/src/app/platform/app/dist /usr/share/nginx/html
# In entrypoint.sh, app-config.js might be overwritten, so chmod it to be writeable.
# The nginx user cannot chmod it, so change to root.
USER root
RUN chmod 666 /usr/share/nginx/html/app-config.js && \
  chmod 664 /etc/nginx/* && \
  chmod 775 /etc/nginx/conf.d && \
  chown -R gen3:root /etc/nginx && \
  yum install -y gettext && \
  yum clean all

USER gen3
ENTRYPOINT ["/usr/src/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
