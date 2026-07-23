/**
 * Module-level accessor for the `appConfig.genericViewports.enabled` opt-in flag.
 *
 * The flag is captured once at extension init (from the `useNextViewports` URL
 * query param, else appConfig) and read by the
 * two viewport-type chokepoints (`getCornerstoneViewportType` and the
 * `CornerstoneViewportService` backend split) without threading appConfig
 * through every service/viewport constructor. Defaults to `false` so the legacy
 * path is unchanged until an app opts in.
 */
let nextViewportsEnabled = false;

export function setNextViewportsEnabled(value: boolean): void {
  nextViewportsEnabled = Boolean(value);
}

export function isNextViewportsEnabled(): boolean {
  return nextViewportsEnabled;
}

/**
 * Resolves the effective flag at init. A `useNextViewports` URL query parameter
 * takes precedence over the appConfig value, so the native backend can be opted
 * into per-session via the URL (e.g. `?useNextViewports=true`) without editing
 * the deployed config. `?useNextViewports` (no value), `=true`, or `=1` enable
 * it; any other value disables it. When the param is absent, appConfig wins.
 */
export function resolveNextViewportsEnabled(appConfigValue: unknown): boolean {
  return resolveBooleanUrlOptIn('useNextViewports', appConfigValue);
}

/**
 * Aliases accepted by the `viewportRendering` param/config, mapped to
 * cornerstone render backend wire ids ('gpu' is the VTK/WebGL backend).
 * Values not listed here pass through untouched so backends registered via
 * cornerstone's `registerRenderBackend()` (e.g. a webgpu backend) can be
 * selected by their wire id.
 */
const RENDER_BACKEND_ALIASES: Record<string, string> = {
  webgl: 'gpu',
  gpu: 'gpu',
  cpu: 'cpu',
  auto: 'auto',
};

function normalizeRenderBackend(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return RENDER_BACKEND_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

export interface ViewportRenderingSelection {
  /** Global render backend for all viewports (cornerstone `setRenderBackend`). */
  renderBackend?: string;
  /**
   * Per-viewport-type overrides (per-mount `renderBackend` option), keyed by
   * the lowercased OHIF viewport type (e.g. 'stack', 'orthographic').
   */
  renderBackendByViewportType: Record<string, string>;
}

/**
 * Resolves the render backend selection at init.
 *
 * `?viewportRendering=cpu|webgl|webgpu|auto` selects the render backend for
 * all viewports per-session, and `?<viewportType>.viewportRendering=<backend>`
 * (e.g. `?orthographic.viewportRendering=cpu`) overrides it for a single
 * viewport type via the per-mount `renderBackend` option. URL params take
 * precedence over `appConfig.genericViewports.viewportRendering`, which accepts
 * either a backend string or `{ default?, stack?, orthographic? }`.
 *
 * 'webgl' is an alias for cornerstone's 'gpu' (VTK/WebGL) backend; 'cpu' and
 * 'auto' map to the same-named backends; any other value is passed through as
 * the wire id of a backend registered with `registerRenderBackend()` (e.g. a
 * webgpu backend). Unlike a boolean CPU flag, this lets a session force GPU
 * rendering when the deployed config defaults to CPU, and vice versa.
 */
export function resolveViewportRendering(appConfigValue: unknown): ViewportRenderingSelection {
  const selection: ViewportRenderingSelection = { renderBackendByViewportType: {} };

  if (typeof appConfigValue === 'string') {
    selection.renderBackend = normalizeRenderBackend(appConfigValue);
  } else if (appConfigValue && typeof appConfigValue === 'object') {
    for (const [key, value] of Object.entries(appConfigValue)) {
      const backend = normalizeRenderBackend(value);
      if (!backend) {
        continue;
      }
      if (key === 'default') {
        selection.renderBackend = backend;
      } else {
        selection.renderBackendByViewportType[key.toLowerCase()] = backend;
      }
    }
  }

  try {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of params.entries()) {
      const backend = normalizeRenderBackend(value);
      if (!backend) {
        continue;
      }
      if (key === 'viewportRendering') {
        selection.renderBackend = backend;
      } else if (key.endsWith('.viewportRendering')) {
        const viewportType = key.slice(0, -'.viewportRendering'.length).toLowerCase();
        if (viewportType) {
          selection.renderBackendByViewportType[viewportType] = backend;
        }
      }
    }
  } catch {
    // window/URL unavailable (SSR/non-browser) — keep the config-derived selection.
  }

  return selection;
}

/**
 * Per-viewport-type render backend overrides, captured once at extension init
 * (like the `useNextViewports` flag above) and read by the native mount paths
 * in NextViewportBackend, which pass the override as the per-mount
 * `renderBackend` option on `setDisplaySets`.
 */
let renderBackendByViewportType: Record<string, string> = {};

export function setViewportRenderingOverrides(overrides: Record<string, string>): void {
  renderBackendByViewportType = overrides ?? {};
}

export function getViewportRenderingOverride(viewportType: string): string | undefined {
  return renderBackendByViewportType[viewportType?.toLowerCase()];
}

/**
 * Reads a boolean opt-in URL query param, falling back to a config value when
 * the param is absent. `?param` (no value), `=true`, or `=1` enable it; any
 * other value disables it.
 */
function resolveBooleanUrlOptIn(paramName: string, fallbackValue: unknown): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has(paramName)) {
      const value = params.get(paramName);
      return value === '' || value === 'true' || value === '1';
    }
  } catch {
    // window/URL unavailable (SSR/non-browser) — fall back to the config value.
  }
  return Boolean(fallbackValue);
}
