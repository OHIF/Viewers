/**
 * Module-level accessor for the `appConfig.useNextViewports` opt-in flag.
 *
 * The flag is captured once at extension init (from appConfig) and read by the
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

// TEMP (remove before merge — see TODO_BEFORE_MERGE.md): a localStorage override
// lets the in-app toggle button flip the backend across reloads without editing
// the config. When the key is absent, appConfig.useNextViewports wins.
const NEXT_VIEWPORTS_OVERRIDE_KEY = 'ohif-use-next-viewports-override';

/**
 * Resolves the effective flag at init: a localStorage override (set by the
 * dev toggle button) takes precedence over the appConfig value.
 */
export function resolveNextViewportsEnabled(appConfigValue: unknown): boolean {
  try {
    const override = window.localStorage?.getItem(NEXT_VIEWPORTS_OVERRIDE_KEY);
    if (override !== null && override !== undefined) {
      return override === 'true';
    }
  } catch {
    // localStorage unavailable (SSR/private mode) — fall back to appConfig.
  }
  return Boolean(appConfigValue);
}

/**
 * Flips the persisted override and reloads so all viewports are re-created with
 * the other backend. Used by the temporary in-toolbar toggle button.
 */
export function toggleNextViewportsAndReload(): void {
  const next = !isNextViewportsEnabled();
  let persisted = false;
  try {
    window.localStorage?.setItem(NEXT_VIEWPORTS_OVERRIDE_KEY, String(next));
    persisted = true;
  } catch {
    // localStorage unavailable — the in-memory flip cannot survive a reload.
  }
  setNextViewportsEnabled(next);
  if (persisted) {
    window.location.reload();
  } else {
    // Reloading would wipe the in-memory flip and re-read the old appConfig value,
    // so the backend would not actually switch. Skip the reload and warn instead.
    console.warn(
      '[next] Could not persist the viewport toggle (localStorage unavailable); reload skipped so the flip is not silently lost.'
    );
  }
}
