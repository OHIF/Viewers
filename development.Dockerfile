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
RUN meteor npm install
COPY dockersupport/settings.json .

EXPOSE 3000

CMD ["meteor", "--settings", "settings.json"]
