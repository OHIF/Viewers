# CastService

Syncs annotations and measurements with a Cast compatible hub (e.g. for multi-user or multi-device sessions). The service subscribes to hub events, publishes local changes, and applies incoming events to the viewer.

## Configuration

Cast is configured via app config under `cast`:

- **`defaultHub`** – Name of the hub to use (must match an enabled entry in `hubs`).
- **`hubs`** – Array of hub configs: `name`, `enabled`, `hub_endpoint`, `token_endpoint`, `client_id`, `client_secret`, `events`, etc.
- **`autoStart`** – If true, get token and subscribe after setting the default hub.
- **`autoReconnect`** – If true, periodically check the WebSocket and resubscribe when the hub requests it.
- **`debug`** – If true, enable verbose logging (e.g. debug-level logs).

Config is validated at startup: if `defaultHub` is set but not found in `hubs` (or the hub is disabled), a warning is logged.

## Public API

- **`setHub(hubName)`** – Switch to a different hub by name.
- **`getHub()`** / **`hub`** – Current hub config.
- **`getToken()`** – Fetch OAuth token for the current hub.
- **`castSubscribe()`** – Subscribe to the hub (WebSocket).
- **`castUnsubscribe()`** – Unsubscribe and close WebSocket.
- **`castPublish(message, hub)`** – Publish a cast message to a hub.
- **`applySceneView(sceneViewData)`** – Apply scene view (camera/slice) data to viewports.
- **`destroy()`** – Unsubscribe from MeasurementService, clear cast-origin state, and destroy the client. Call when tearing down the viewer.

## Supported events

- **`patient-open`** – Navigate to `/?mrn=<mrn>` when patient context is provided.
- **`patient-close`**, **`imagingstudy-close`**, **`diagnosticreport-close`** – Navigate to `/` when already in a session.
- **`imagingstudy-open`** – Open viewer with given study UID (`/viewer?StudyInstanceUIDs=...&Cast`).
- **`annotation-update`** – Create or update annotation (and optional measurement) from hub; syncs with Cornerstone and MeasurementService.
- **`annotation-delete`** – Remove annotation by UID from MeasurementService and Cornerstone.
- **`measurement-update`** – Create or update measurement from hub.
- **`get-request`** – Respond to SCENEVIEW get-request.

## Annotation publishing

Only **ArrowAnnotate** annotations are published. Annotation updates are throttled (1s) to avoid flooding the hub. Measurements are published via MeasurementService’s publish options (see `setPublishOptions`).

## Cleanup

Call **`destroy()`** when the viewer or extension is torn down so that subscriptions and the WebSocket are closed and no references are retained.
