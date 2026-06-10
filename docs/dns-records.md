# BlackVoxel DNS Records

## Routing method: Cloudflare Tunnel (no VPS required)

All public subdomains are routed via a named Cloudflare Tunnel running on the founder's
local machine. The tunnel terminates TLS at Cloudflare's edge — no Let's Encrypt
certificates or Nginx SSL config are needed on the origin.

### Tunnel details

| Field | Value |
|-------|-------|
| Tunnel name | `blackvoxel-demo` |
| Tunnel ID | `d0741e42-ef62-44d5-8925-2a089673e753` |
| Credentials | `~/.cloudflared/d0741e42-ef62-44d5-8925-2a089673e753.json` |
| Config | `~/.cloudflared/config.yml` |

### Active DNS records (Cloudflare-managed CNAMEs)

| Hostname | Target | Local service |
|----------|--------|---------------|
| `blackvoxel.ai` | `d0741e42-ef62-44d5-8925-2a089673e753.cfargotunnel.com` | `localhost:8000` (1_blackvoxel FastAPI) |
| `viewer.blackvoxel.ai` | `d0741e42-ef62-44d5-8925-2a089673e753.cfargotunnel.com` | `localhost:3000` (MIMPS viewer) |

### Starting the tunnel

```bash
cloudflared tunnel run blackvoxel-demo
```

Both URLs are live over HTTPS as long as this command is running and local services are up.

### Upgrading to VPS (future)

When MIMPS-12 (VPS provisioning) is completed, replace the Cloudflare Tunnel routing
with direct DNS A records pointing to the VPS IP, and run certbot for HTTPS:

```bash
certbot certonly --nginx -d viewer.blackvoxel.ai
```

Update the Nginx config at `docker/nginx.conf` to add the SSL server block at that time.
