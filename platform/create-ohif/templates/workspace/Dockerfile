# syntax=docker/dockerfile:1
# Workspace viewer image: nginx serving the harness production build.
#
# Build the viewer first (writes .ohif/platform/app/dist), then the image:
#   pnpm build
#   docker build -t {{dirName}} .
#   docker run -p 3000:80 {{dirName}}
#
# At container start, a non-empty APP_CONFIG environment variable (the full
# JS text of an app config) replaces the baked-in app-config.js:
#   docker run -p 3000:80 -e APP_CONFIG="$(cat config/app-config.js)" {{dirName}}

FROM nginx:1.27-alpine

# Single-page app routing: unknown paths fall back to index.html.
COPY <<'NGINXCONF' /etc/nginx/conf.d/default.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
NGINXCONF

# The built viewer and the committed workspace config.
COPY .ohif/platform/app/dist /usr/share/nginx/html
COPY config/app-config.js /usr/share/nginx/html/app-config.js

# APP_CONFIG entrypoint hook: the stock nginx entrypoint runs every executable
# /docker-entrypoint.d/*.sh before starting nginx.
COPY <<'APPCONFIGSH' /docker-entrypoint.d/60-app-config.sh
#!/bin/sh
if [ -n "$APP_CONFIG" ]; then
  echo "$APP_CONFIG" > /usr/share/nginx/html/app-config.js
  echo "app-config.js written from the APP_CONFIG environment variable"
fi
APPCONFIGSH
RUN chmod +x /docker-entrypoint.d/60-app-config.sh

EXPOSE 80
