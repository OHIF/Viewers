# First stage of multi-stage build
# Installs Meteor and builds node.js version
# This stage is named 'builder'
# The data for this intermediary image is not included
# in the final image.
FROM node:8.10.0-slim as builder

RUN apt-get update && apt-get install -y \
	curl \
	g++ \
	build-essential

RUN curl https://install.meteor.com/ | sh

# Create a non-root user
RUN useradd -ms /bin/bash user
USER user
ADD --chown=user:user . /home/user/Viewers

WORKDIR /home/user/Viewers/OHIFViewer

RUN meteor npm install
ENV METEOR_PACKAGE_DIRS=../Packages
RUN meteor build --directory /home/user/app
WORKDIR /home/user/app/bundle/programs/server
RUN npm install --production

# Second stage of multi-stage build
# Creates a slim production image for the node.js application
#
# TODO: Switch to node:8.10.0-alpine for size purposes. I was getting Segmentation Faults from the node
# process. There are probably some minor changes to be made to ensure it works.
FROM node:8.10.0-slim

WORKDIR /app
COPY --from=builder /home/user/app .

RUN npm install -g pm2

ADD dockersupport/app.json . 

ENV ROOT_URL http://localhost:3000
ENV PORT 3000
ENV NODE_ENV development

EXPOSE 3000

WORKDIR /app
CMD ["pm2-runtime", "app.json"]

