# Docker compose files

# Build

Using docker compose you can build the image with the following command:

```bash
docker-compose build
```

# Run

To run the container use the following command:

```bash
docker-compose up
```


# Routes

http://localhost/ -> OHIF
localhost/pacs -> Orthanc


See [here](../../../docs/docs/deployment/nginx--image-archive.md) for more information about this recipe.

# Security notes

- CORS: earlier versions of this recipe set `Access-Control-Allow-Origin: *`
  on the `/pacs/` proxy. That default has been removed. The viewer is served
  by the same nginx as the proxy, so same-origin deployments need no CORS
  headers. If you host the viewer on a different origin, set that origin
  explicitly in `config/nginx.conf` - never `*` on an endpoint that serves
  PHI.
