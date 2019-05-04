# Stage 1: Build the application
# docker build -t ohif/viewer:latest .
FROM node:11.2.0-slim as builder

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

ENV REACT_APP_CONFIG=config/example_openidc.js
ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY package.json /usr/src/app/package.json
COPY yarn.lock /usr/src/app/yarn.lock

ADD . /usr/src/app/
RUN yarn install
RUN yarn run build:web

# Stage 2: Bundle the built application into a Docker container
# which runs openresty (nginx) using Alpine Linux
FROM openresty/openresty:alpine-fat

RUN mkdir /var/log/nginx
RUN apk add --no-cache openssl
RUN apk add --no-cache openssl-dev
RUN apk add --no-cache git
RUN apk add --no-cache gcc
# RUN luarocks install lua-resty-openidc

RUN luarocks install lua-resty-jwt
RUN luarocks install lua-resty-session
RUN luarocks install lua-resty-jwt
RUN luarocks install lua-resty-http
RUN luarocks install lua-resty-openidc
RUN luarocks install luacrypto

# Copy build output to image
COPY --from=builder /usr/src/app/build /var/www/html

ENTRYPOINT ["/usr/local/openresty/nginx/sbin/nginx", "-g", "daemon off;"]
