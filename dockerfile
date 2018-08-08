# First stage of multi-stage build
# Installs Meteor and builds node.js version
# This stage is named 'builder'
# The data for this intermediary image is not included
# in the final image.
FROM node:8.10.0-slim as builder

RUN apt-get update && apt-get install -y \
	curl \
	g++ \
	git \
	python \
	build-essential

RUN curl https://install.meteor.com/ | sh

# Create a non-root user
RUN useradd -ms /bin/bash user
USER user
RUN mkdir /home/user/Viewers
COPY OHIFViewer/package.json /home/user/Viewers/OHIFViewer/
ADD --chown=user:user . /home/user/Viewers

WORKDIR /home/user/Viewers/OHIFViewer

ENV METEOR_PACKAGE_DIRS=../Packages
ENV METEOR_PROFILE=1
RUN meteor npm install
RUN meteor build --directory /home/user/app
WORKDIR /home/user/app/bundle/programs/server
RUN npm install --production

# Second stage of multi-stage build
# Creates a slim production image for the node.js application
FROM node:8.10.0-slim

RUN npm install -g pm2

WORKDIR /app
COPY --from=builder /home/user/app .
COPY dockersupport/app.json .

ENV ROOT_URL http://localhost:3000
ENV PORT 3000
ENV NODE_ENV production

EXPOSE 3000

CMD ["pm2-runtime", "app.json"]
