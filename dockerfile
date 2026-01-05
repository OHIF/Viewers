# --- ETAPA 1: Construcción (Builder) ---
FROM node:20-slim as builder

# Instalar herramientas del sistema (Igual que tu original)
RUN apt-get update && apt-get install -y python3 make g++ git curl unzip

WORKDIR /usr/src/app

# Instalar gestores globales
RUN npm install -g bun lerna

# Path para binarios locales
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# Copiar archivos de configuración
COPY package.json yarn.lock preinstall.js lerna.json ./

# Copiar estructura
COPY extensions/ ./extensions/
COPY modes/ ./modes/
COPY platform/ ./platform/

# --- FIX 1: Configurar timeout para evitar cortes en redes lentas ---
RUN yarn config set network-timeout 300000

# Instalar dependencias (Tu comando original)
RUN yarn install --frozen-lockfile

# Copiar el resto del código
COPY . .

# --- FIX 2: Parches Críticos (El error que te salía antes) ---
# Agregamos postcss y preset-env explícitamente porque Webpack se quejaba de no encontrarlos
RUN yarn add react-refresh postcss postcss-preset-env -W

# Variables de entorno para producción
ENV NODE_ENV=production
ENV QUICK_BUILD=false
ENV PUBLIC_URL=/
# --- FIX 3: Aumentar memoria para el build (Evita crash en compilación de fuentes) ---
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Compilar
RUN yarn run build

# --- ETAPA 2: Servidor Producción (Nginx + Proxy Reverso) ---
FROM nginx:alpine

# Herramientas SSL
RUN apk add --no-cache openssl bash

# 1. Copiar los archivos compilados
COPY --from=builder /usr/src/app/platform/app/dist /usr/share/nginx/html

# 2. --- FIX 4: Copiar NUESTRO nginx.conf personalizado ---
# (Vital para que Keycloak y el Proxy funcionen bien con SSL)
COPY nginx.conf /etc/nginx/nginx.conf

# 3. Script de arranque (Tu script original mantenido)
RUN mkdir -p /etc/nginx/certs && \
    printf "#!/bin/bash\n\
if [ ! -f /etc/nginx/certs/nginx-selfsigned.key ]; then\n\
    echo 'Generando certificado SSL autofirmado...'\n\
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/nginx-selfsigned.key \
    -out /etc/nginx/certs/nginx-selfsigned.crt \
    -subj '/C=AR/ST=RioNegro/L=Bariloche/O=CNEA/CN=localhost'\n\
fi\n\
exec nginx -g 'daemon off;'" > /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 443

ENTRYPOINT ["/entrypoint.sh"]