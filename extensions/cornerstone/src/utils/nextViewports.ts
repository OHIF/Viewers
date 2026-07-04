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
  return resolveBooleanUrlOptIn('useNextViewports', appConfigValue);
}

/**
 * Resolves the effective CPU-rendering flag at init. A `cpu` URL query parameter
 * takes precedence over `appConfig.useCPURendering`, so the CPU render path can
 * be forced per-session via the URL (e.g. `?cpu=true`) without editing the
 * deployed config. `?cpu` (no value), `=true`, or `=1` enable it; any other
 * value disables it. When the param is absent, appConfig wins.
 *
 * Under `useNextViewports` this drives the native GenericViewport onto the CPU
 * render path (CPU_IMAGE / CPU_VOLUME): cornerstone's PlanarRenderPathDecision
 * consults the global `setUseCPURendering` flag for both the image and volume
 * paths, so a single `?cpu=true` forces the next viewport to render on CPU.
 */
export function resolveUseCPURendering(appConfigValue: unknown): boolean {
  return resolveBooleanUrlOptIn('cpu', appConfigValue);
}

/**
 * Resolves the effective stability-gated sync policy flag at init. A
 * `useSyncStabilityPolicy` URL query parameter takes precedence over the
 * appConfig value, so the policy can be opted into per-session via the URL
 * (e.g. `?useSyncStabilityPolicy=true`) without editing the deployed config.
 * `?useSyncStabilityPolicy` (no value), `=true`, or `=1` enable it; any other
 * value disables it. When the param is absent, appConfig wins. Defaults to
 * `false` so synchronizers behave exactly as before until an app opts in.
 */
export function isSyncStabilityPolicyEnabled(appConfigValue: unknown): boolean {
  return resolveBooleanUrlOptIn('useSyncStabilityPolicy', appConfigValue);
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
