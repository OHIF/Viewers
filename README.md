<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<div align="center">
  <h1>QCT Web Viewer</h1>
  <p><strong>QCT Web Viewer</strong> is a zero-footprint medical image viewer developed by the <a href="https://www.bonestech.com/">BONESTECH</a>. It is a configurable and extensible progressive web application with out-of-the-box support for image archives which support <a href="https://www.dicomstandard.org/using/dicomweb/">DICOMweb</a>.</p>
</div>

## About

The QCT Web Viewer is a medical imaging platform that supports 2D, 3D, and Multiplanar Reconstruction (MPR) of images from multiple formats and sources. It enables precise bone density analysis for eligible CT data, improving measurement accuracy to 99%. Key features include image manipulation, annotation, saving of observations, internationalization, OpenID Connect integration, offline use, and hotkey support. The platform is designed to enhance diagnostic workflows and will expand to support scientific research in the future.

### Support

- Report a Bug 🐛: [zhengchen@bonestech.com](mailto:zhengchen@bonestech.com)
- Request a Feature 🚀: [zhengchen@bonestech.com](mailto:zhengchen@bonestech.com)
- Ask a Question 🤗: [zhengchen@bonestech.com](mailto:zhengchen@bonestech.com)

## Developing

The current version implement the basic medical image visualization functions. Future updates will include features such as bone density measurement.

### Requirements

- [Yarn 1.17.3+](https://yarnpkg.com/en/docs/install)
- [Node 18+](https://nodejs.org/en/)
- [Docker for Mac](https://docs.docker.com/docker-for-mac/)
- [Docker for Windows](https://docs.docker.com/docker-for-windows/)
_Not sure if you have `docker` installed already? Try running `docker --version`
in command prompt or terminal_
- Yarn Workspaces should be enabled on your machine:
  - `yarn config set workspaces-experimental true`

### Getting Started

### Setup

- `cd platform/app/.recipes/Nginx-Orthanc`
- run: `docker-compose up --build`
- Navigate to `YOUR_SERVERIP` for the viewer (Note: Please remember to update the `serverIP` in both the `nginx.config` and `orthanc.json` files.)
- Navigate to `YOUR_SERVERIP/pacs` for uploading studies via the UI, or send studies via DIMSE C-STORE to `ORTHANC@YOUR_SERVERIP:4242` (hint: you can use utilizes like dcm4che's `storescu` to send studies in bulk via the command line)

:::note
For subsequent runs, use `docker-compose up -d` to start the services without rebuilding the images. However, ensure you rebuild the images if you make changes to the Dockerfile. If you modify the configurations in the `nginx.conf` or `orthanc.json` files, you can restart the services by running `docker-compose up`, as these files are mounted as volumes.

```
Inside docker compose file you see the following volumes mounted:

volumes:
  # Nginx config
  - ./config/nginx.conf:/etc/nginx/nginx.conf
  # Logs
  - ./logs/nginx:/var/logs/nginx
```
