/**
 * Playwright waits for "navigation" after many clicks. OHIF uses SPA / history
 * updates for hanging protocols, tool activation, hydration, and panels; on CI
 * that wait can hit the default timeout even when the UI is fine.
 *
 * Use this for clicks that are followed by explicit waits, screenshots, or
 * assertions — not for real full-page navigations.
 */
export const CLICK_NO_NAV_WAIT = { noWaitAfter: true as const };
