##

Linode 8 GB


Install Docker linux

Install Node
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

Installing Yarn



## Temporary SSL using DuckDNS

1. Go to [DuckDNS](https://www.duckdns.org/domains) and create a subdomain, e.g., `hospital.duckdns.org`.

2. Run certbot in the `Nginx-Orthanc-Keycloak` directory. Replace the domain and email placeholders with your actual subdomain and email:

    ```bash
    docker run -it --rm --name certbot \
        -v ./config/letsencrypt:/etc/letsencrypt \
        -v ./config/certbot:/var/www/certbot \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --preferred-challenges http \
        --email your_email@example.com \
        --agree-tos \
        --no-eff-email \
        -d hospital.duckdns.org
    ```

3. Your certificates are now generated in `/config/letsencrypt` and `/config/certbot`.

## Updating the OHIF config and building the viewer

1. Rename `docker-nginx-orthanc-keycloak.js` to `default.js`.

2. Update the following configuration in `default.js`:

    ```javascript
    wadoUriRoot: 'https://hospital.duckdns.org/pacs',
    qidoRoot: 'https://hospital.duckdns.org/pacs',
    wadoRoot: 'https://hospital.duckdns.org/pacs',
    ```

3. Run the build command from the root directory:

    ```bash
    yarn build
    ```


## Update oauth-2proxy config

1. Change the `redirect_url` and `oidc_issuer_url` to your domain:

    ```ini
    redirect_url=https://hospital.duckdns.org/oauth2/callback
    oidc_issuer_url=https://hospital.duckdns.org/keycloak/realms/ohif
    ```

## Update nginx config

1. Replace all `server_name` properties with your domain:

    ```nginx
    server_name hospital.duckdns.org;
    ```

## Replace '127.0.0.1' placeholders

Crtl + F for all 127.0.0.1 place holders and replace the with the correct values

## Build the Docker Compose

1. Navigate to the `Nginx-Orthanc-Keycloak` directory.

2. Build the Docker Compose:

    ```bash
    docker compose build
    ```

## Start the Docker Compose

1. Start the Docker Compose:

    ```bash
    docker compose up
    ```

## Adjusting the callback URLs to your actual IP/Domain

1. Visit the Keycloak dashboard at `https://hospital.duckdns.org/keycloak` and log in with:

    - Admin: `admin`
    - Password: `admin`

2. From the realms menu, choose **OHIF**, then **Clients**, then **ohif-viewer**.

3. Update the following fields:

    - **Root URL**: `http://hospital.duckdns.org`
    - **Home URL**: `http://hospital.duckdns.org`
    - **Valid Redirect URIs**: `http://hospital.duckdns.org/oauth2/callback`
    - **Web Origins**: `http://hospital.duckdns.org`
    - **Admin URL**: `http://hospital.duckdns.org`

## Visiting the viewer

1. The OHIF viewer is available at: `http://hospital.duckdns.org` or `http://hospital.duckdns.org/ohif-viewer`.

2. Predefined users:

    - Viewer: `viewer`
    - Password: `viewer`
    - PACS Admin: `pacsadmin`
    - Password: `pacsadmin`

### Local Domain

- If running this on your machine for testing purposes, replace all instances of the domain with `127.0.0.1` and use the `http` protocol.
- Adjust the nginx config accordingly to remove `https`.

---


If build crashes at 92% terser plugin it means that the build is running out of memory. You can increase the memory limit by running the following

    ```bash
    export NODE_OPTIONS=--max_old_space_size=4096
    ```
