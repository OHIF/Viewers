---
sidebar_position: 4
---

# Docker

The OHIF source code provides a Dockerfile to create and run a Docker image that containerizes an [nginx](https://www.nginx.com/) web server serving the OHIF Viewer.


## Prequisites
The machine on which to build and run the Docker container must have:
1. All of the [requirements](./build-for-production.md#build-for-production) for building a production version of OHIF.
2. A checked out branch of the OHIF Viewer.
3. [Docker](https://docs.docker.com/get-docker/) installed.

## Building the Docker Image
The docker image can be built from a terminal window as such:
1. Switch to the OHIF Viewer code root directory.
2. Issue the following docker command. Note that what follows `-t` flag is the `{name}:{tag}` for the Docker image and is arbitrary when creating a local Docker image.

    ```sh
    docker build . -t ohif-viewer-image
    ```

## Running the Docker Container
Once the Docker image has been built, it can be run as a container from the command line as in the block below. Note that the last argument to the command is the name of the Docker image and the table below describes the other arguments.

|Flag|Description|
|----|-----------|
|-d|Run the container in the background and print the container ID|
|-p {host-port}:{nginx-port}/tcp|Publish the `nginx` listen port on the given host port|
|--name|An arbitrary name for the container.|


```sh
docker run -d -p 3000:80/tcp --name ohif-viewer-container ohif-viewer-image
```

### Configuring the `nginx` Listen Port

The Dockerfile and entry point use the `${PORT}` environment variable as the port that the `nginx` server uses to serve the web server. The default value for `${PORT}` is `80`. One way to set this environment variable is to use the `-e` switch when running the container with `docker run`. The block below gives an example where the listen port is set to `8080` and publised on the host as `3000`.

```sh
docker run -d -e PORT=8080 -p 3000:8080/tcp --name ohif-viewer-container ohif-viewer-image
```

### Configuring the OHIF config file

The OHIF [config file](../configuration/configurationFiles.md) to use can be specified by mounting it as a volume for the Docker container using the `-v` flag. If the OHIF config file is on the local file system then it can be specified as below. Note that depending on the version of Docker, an absolute path to the config file might be required.

```sh
docker run -d -p 3000:80/tcp -v /path/to/config/file.js:/usr/share/nginx/html/app-config.js --name ohif-viewer-container ohif-viewer-image
```
