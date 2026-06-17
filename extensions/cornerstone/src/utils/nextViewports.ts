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
