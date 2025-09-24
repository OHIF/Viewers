---
sidebar_position: 4
title: Docker Deployment
summary: Comprehensive guide for deploying OHIF Viewer using Docker, covering pre-built images from Docker Hub, custom image building, configuration options through build arguments and environment variables, and runtime container management.
---

# Docker

The OHIF source code provides a [Dockerfile](https://github.com/OHIF/Viewers/blob/master/Dockerfile) to create and run a Docker image that containerizes an [nginx](https://www.nginx.com/) web server serving the OHIF Viewer.

:::info
This Dockerfile is the same used to generate the [OHIF image(s) on Docker Hub](https://hub.docker.com/r/ohif/app/tags).
:::


## Running the Docker Container with our pre-built images from Docker Hub


To run the Docker container, use the following command based on whether you're targeting a release or beta version. (Learn more about versioning [here](../../development/getting-started.md#branches).)

```sh
#  beta version
docker run -d -p 3000:80 ohif/app:v3.10.0-beta.33

# release version
docker run -d -p 3000:80 ohif/app:v3.9.2
```

This will run the Docker container and serve the OHIF Viewer at `http://localhost:3000`. You can name the container anything you want by adding the `--name` flag (e.g., `docker run -d -p 3000:80 --name ohif-viewer-container ohif/app:v3.10.0-beta.33`).


## Building the Docker Image From Source

:::tip
Building a Docker image comes in handy when OHIF has been customized (e.g. with custom extensions, modes, hanging protocols, etc.). For convenience, there are basic OHIF images built in Docker Hub. Find the latest [release](https://hub.docker.com/r/ohif/app/tags?page=1&name=latest) and [dev](https://hub.docker.com/r/ohif/app/tags?page=1&name=beta) images all in Docker Hub.
:::

### Prerequisites
The machine on which to build and run the Docker container must have:
1. All of the [requirements](../build-for-production.md#build-for-production) for building a production version of OHIF.
2. A checked out branch of the OHIF Viewer.
3. [Docker](https://docs.docker.com/get-docker/) installed.

### Building the Docker Image

:::info
In this tutorial, we will build the Docker image for the OHIF Viewer and OHIF server as defined in the `default.js` config which points to our server and our studies.

If you need the Viewer to show your own server studies, you need to build the viewer with a custom configuration that points to your server and your studies.

You can set build arguments to point to your custom configuration file. For more information on data sources, see [here](../../platform/extensions/modules/data-source.md).

:::




To build the Docker image from the terminal:

- Navigate to the OHIF Viewer code root directory (base of the monorepo).
- Run a basic Docker build command:

    ```sh
    docker build . -t ohif-viewer-image
    ```

  *Note*: The name `ohif-viewer-image` is an example. You can replace it with any name and tag of your choice by changing the `-t` value (e.g., `-t my-image:latest`). This naming is arbitrary for local Docker images.

- To customize the build, you can include optional build arguments to set defaults for the app configuration, public path, or port:

    ```sh
    docker build . -t ohif-viewer-image \
      --build-arg APP_CONFIG=config/e2e.js \
      --build-arg PUBLIC_URL=/ohif/ \
      --build-arg PORT=6000
    ```

#### Available Build Arguments (Optional)
You can use the following build arguments to customize the Docker image:

- `APP_CONFIG`: (Optional) Sets the default app configuration (e.g., `config/e2e.js`). This value can be overridden later by setting an environment variable (you can set it in the docker run command).
- `PUBLIC_URL`: (Optional) Specifies the public path for serving the OHIF Viewer (e.g., `/ohif/`). This value is baked into the build and cannot be changed without rebuilding the image.
- `PORT`: (Optional) Sets the application’s port.

#### Examples of Using Build Arguments
Here are examples of how to use the `--build-arg` option:

- Set the public path:

    ```sh
    docker build . --build-arg PUBLIC_URL=/ohif/
    ```

- Set a custom app configuration:

    ```sh
    docker build . --build-arg APP_CONFIG=config/kheops.js
    ```

- Specify a port:

    ```sh
    docker build . --build-arg PORT=6000
    ```

- Combine multiple arguments:

    ```sh
    docker build . --build-arg PUBLIC_URL=/ohif/ --build-arg APP_CONFIG=config/kheops.js --build-arg PORT=6000
    ```

:::info PUBLIC_URL Explanation
The `PUBLIC_URL` build argument sets the public path for serving the OHIF Viewer. For example, using `--build-arg PUBLIC_URL=/ohif/` will serve the worklist at `http://host/ohif/` and the viewer at `http://host/ohif/viewer`. While the worklist is also accessible at `http://host/`, it redirects to the `PUBLIC_URL`.
:::

---

## Running the Docker Container

After building the Docker image, you can run it as a container using the following command. The name of the Docker image (`ohif-viewer-image`) is specified at the end, while the flags control various runtime settings.

```sh
docker run -d -p 3000:80/tcp --name ohif-viewer-container ohif-viewer-image
```

- `-d`: Runs the container in the background and prints the container ID.

- `-p {host-port}:{nginx-port}/tcp`: Maps the container's `nginx` port to a port on the host machine. For example, `3000:80` maps host port 3000 to container port 80.

- `--name`: Assigns an arbitrary name to the container for easy identification (e.g., `ohif-viewer-container`).



### Configuring the `nginx` Listen Port

The `nginx` server uses the `{PORT}` environment variable to determine the listening port inside the container. By default, this is set to `80`. You can override it during runtime or build:

#### Setting the Port at Runtime

Use the `-e PORT={container-port}` flag to set the listening port and publish it with `-p`. For example, the following command sets the container port to `8080` and maps it to host port `3000`:

```sh
docker run -d -e PORT=8080 -p 3000:8080/tcp --name ohif-viewer-container ohif-viewer-image
```

#### Setting the Port During Build

To bake the port configuration into the Docker image, use the `--build-arg PORT={container-port}` flag when building the image:

```sh
docker build . --build-arg PORT=8080
```

then you can run the container with the following command:

```sh
docker run -d -p 3000:8080/tcp --name ohif-viewer-container ohif-viewer-image
```

---

### Specifying the OHIF Configuration File

You can specify the OHIF configuration file for the container in three ways:

1. **[Build Default](#build-default)**: Set the default configuration file during the build process.
2. **[Volume Mounting](#volume-mounting)**: Mount a local configuration file into the container.
3. **[Environment Variable](#environment-variable)**: Pass the configuration file contents directly as an environment variable.

#### Build Default

Set the configuration file during the build process using the `--build-arg APP_CONFIG={config-path}` flag. For example:

```sh
docker build . --build-arg APP_CONFIG=config/kheops
```

---

#### Volume Mounting

To use a local configuration file, mount it as a volume during runtime. For example, to use a file located at `/path/to/config/file.js`, use the `-v` flag:

```sh
docker run -d -p 3000:80/tcp -v /path/to/config/file.js:/usr/share/nginx/html/app-config.js --name ohif-viewer-container ohif-viewer-image
```

:::tip
Ensure the path to the local configuration file is absolute, as some Docker versions require it.
:::

---

#### Environment Variable

Alternatively, you can specify the configuration file contents directly as an environment variable (`APP_CONFIG`). This method is useful in environments like Google Cloud.

**Important**: The `APP_CONFIG` variable must contain the file's contents, not its file path. Use the `cat` command to read the file and pass its contents as the environment variable:

```sh
docker run -d -p 3000:80/tcp -e APP_CONFIG="$(cat /path/to/the/config/file)" --name ohif-viewer-container ohif-viewer-image
```

:::tip
- Remove single-line comments (`//`) from the configuration file to prevent issues when serving the file to the OHIF client.
- As an alternative to the `cat` command, you can convert the file to a single line and copy-paste it directly. Tools like [Visual Studio Code](https://stackoverflow.com/questions/46491061/shortcut-for-joining-two-lines) and [Notepad++](https://superuser.com/questions/518229/how-do-i-remove-linebreaks-in-notepad) offer "Join Lines" commands to help with this.
- If both the [Volume Mounting](#volume-mounting) and [Environment Variable](#environment-variable) methods are used, the Volume Mounting method takes precedence.
:::

---

This rewrite improves readability by reorganizing information into smaller, clear sections and providing consistent formatting for examples and tips.
