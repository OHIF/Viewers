/**
 * Module-level accessor for the `appConfig.useNextViewports` opt-in flag.
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
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('useNextViewports')) {
      const value = params.get('useNextViewports');
      return value === '' || value === 'true' || value === '1';
    }
  } catch {
    // window/URL unavailable (SSR/non-browser) — fall back to appConfig.
  }
  return Boolean(appConfigValue);
}
