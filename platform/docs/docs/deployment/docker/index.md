---
sidebar_position: 4
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
1. All of the [requirements](./build-for-production.md#build-for-production) for building a production version of OHIF.
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
Once the Docker image has been built, it can be run as a container from the command line as in the block below. Note that the last argument to the command is the name of the Docker image and the table below describes the other arguments.

|Flag|Description|
|----|-----------|
|-d|Run the container in the background and print the container ID|
|-p `{host-port}:{nginx-port}/tcp`|Publish the `nginx` listen port on the given host port|
|--name|An arbitrary name for the container.|


```sh
docker run -d -p 3000:80/tcp --name ohif-viewer-container ohif-viewer-image
```

:::tip
Any of the [Docker Hub images](https://hub.docker.com/r/ohif/app/tags) can be easily run as a Docker container.

The following is the command to run the Docker container using the latest released OHIF Docker Hub image.

```sh
docker run -d -p 3000:80/tcp --name LatestReleasedOHIF ohif/app:latest
```

Simply replace `latest` at the end of the command with any of the tags for a specific version.
:::

### Configuring the `nginx` Listen Port

The Dockerfile and entry point use the `{PORT}` environment variable as the port that the `nginx` server uses to serve the web server. The default value for `{PORT}` is `80`. One way to set this environment variable is to use the `-e` switch when running the container with `docker run`. The block below gives an example where the listen port is set to `8080` and published on the host as `3000`.

```sh
docker run -d -e PORT=8080 -p 3000:8080/tcp --name ohif-viewer-container ohif-viewer-image
```

The default port can also be configured during build with:
```sh
docker build . --build-arg PORT=8080
```

### Specifying the OHIF config File

There are three approaches for specifying the OHIF configuration file for a Docker container:

- [Build Default](#build-default)
- [Volume Mounting](#volume-mounting)
- [Environment Variable](#environment-variable)

#### Build Default

The default OHIF configuration file can be specified during build with a `--build-arg APP_CONFIG=config/kheops` argument added to the build command.


#### Volume Mounting

The OHIF [config file](../../configuration/configurationFiles.md) can be specified by mounting it as a volume for the Docker container using the `-v` flag. If the OHIF config file is on the local file system then it can be specified as below.

```sh
docker run -d -p 3000:80/tcp -v /path/to/config/file.js:/usr/share/nginx/html/app-config.js --name ohif-viewer-container ohif-viewer-image
```
:::tip
 Depending on the version of Docker, an absolute path to the local source config file might be required.
:::
#### Environment Variable

In certain scenarios, such as deploying the Docker container to Google Cloud, it might be convenient to specify the configuration file (contents) as an environment variable. That environment variable is `{APP_CONFIG}` and it can be set in the `docker run` command using the `-e` switch.

:::tip
It is important to stress here that the environment variable is the contents of the configuration file and NOT the path to the config file as is [typically specified](https://docs.ohif.org/configuration/configurationFiles#configuration-files) for development and build environments or for the [volume mounting method](#volume-mounting).
:::

Below the `cat` command is used to convert the configuration file to a string and its result set as the `{APP_CONFIG}` environment variable.

```sh
docker run -d -p 3000:80/tcp -e APP_CONFIG="$(cat /path/to/the/config/file)" --name ohif-viewer-container ohif-viewer-image
```

:::tip
- To be safe, remove single line comments (i.e. `//`) from the configuration file because the presence of these comments might cause the configuration file to be prematurely truncated when it is served to the OHIF client
- As an alternative to the `cat` command, convert the configuration file to a single line and copy and paste it as the value to the `{APP_CONFIG}` environment variable on the `docker run` line. Editors such as [Visual Studio Code](https://stackoverflow.com/questions/46491061/shortcut-for-joining-two-lines) and [Notepad++](https://superuser.com/questions/518229/how-do-i-remove-linebreaks-in-notepad) have 'Join Lines' commands to facilitate this
- If both the [volume mounting method](#volume-mounting) and the [environment variable method](#environment-variable) are used, the volume mounting method will take precedence
:::


### Embedding in an iframe

If the OHIF instance served by the Docker image is to be embedded in an `iframe`, and if  [cross-origin isolation](./cors.md#cross-origin-isolation) is required, then the [Cross Origin Resource Policy (CORP) header value](https://github.com/OHIF/Viewers/blob/8a8ae237d26faf123abeb073cbf0cd426c3e9ef2/.docker/Viewer-v3.x/default.conf.template#L10) that OHIF is served with will have to be updated accordingly. More information on CORP and `iframe`s can be found [here](./cors.md#ohif-as-a-cross-origin-resource-in-an-iframe).

:::tip
For SSL Docker deployments, the CORP header value is set [here](https://github.com/OHIF/Viewers/blob/8a8ae237d26faf123abeb073cbf0cd426c3e9ef2/.docker/Viewer-v3.x/default.ssl.conf.template#L12).
:::
