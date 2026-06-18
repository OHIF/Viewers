/**
 * langBridge.ts
 *
 * Carries the PT/EN language choice from the BlackVoxel platform
 * (blackvoxel.ai) into the MIMPS viewer (I18N-04).
 *
 * Flow:
 *   1. The platform opens the viewer as `...?token=<jwt>&lang=<pt|en>`.
 *   2. applyLangFromQuery() reads `?lang=`, maps it to OHIF's locale code
 *      ('pt' -> 'pt-BR', 'en' -> 'en-US'), switches i18next, and lets the
 *      i18next LanguageDetector cache persist it (localStorage 'i18nextLng' +
 *      cookie), so the choice sticks across in-app navigation.
 *   3. The `lang` param is stripped from the URL bar (cosmetic — keeps the
 *      address clean, same idiom as the JWT strip in jwtBridge.ts).
 *
 * No framework dependencies beyond the shared @ohif/i18n singleton so it can be
 * called once, early, from App startup.
 */

import i18n from '@ohif/i18n';

/** Canonical OHIF locale codes used across the viewer. */
export const OHIF_LOCALE_PT = 'pt-BR';
export const OHIF_LOCALE_EN = 'en-US';

/**
 * Map a platform language token ('pt' | 'en', case-insensitive) to OHIF's
 * locale code. Returns null for anything we don't recognise so callers can
 * leave the detector's own choice untouched.
 */
export function mapPlatformLangToLocale(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const v = raw.trim().toLowerCase();
  if (v === 'pt' || v === 'pt-br') {
    return OHIF_LOCALE_PT;
  }
  if (v === 'en' || v === 'en-us') {
    return OHIF_LOCALE_EN;
  }
  return null;
}

/**
 * Switch i18next to the given OHIF locale and persist it. Safe to call before
 * i18next has finished initializing — it waits on `i18n.initializing` so the
 * change isn't clobbered by the async init resolving afterwards.
 */
export function setViewerLanguage(locale: string): void {
  const apply = () => {
    if (i18n.language !== locale) {
      // changeLanguage triggers the LanguageDetector cache (localStorage +
      // cookie), which is what makes the choice survive navigation/reload.
      i18n.changeLanguage(locale);
    }
  };
  // i18n.initializing is the promise returned by initI18n() (see @ohif/i18n).
  if (i18n.initializing && typeof i18n.initializing.then === 'function') {
    i18n.initializing.then(apply);
  } else {
    apply();
  }
}

/**
 * Call once at app startup (alongside extractAndStoreToken). Reads `?lang=`
 * from the URL, applies + persists the mapped locale, and strips the param
 * from the address bar. No-op when `lang` is absent or unrecognised.
 */
export function applyLangFromQuery(): void {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    return;
  }

  const raw = params.get('lang');
  const locale = mapPlatformLangToLocale(raw);

  if (locale) {
    setViewerLanguage(locale);
  }

  // Strip `lang` from the URL bar regardless of whether it mapped, so a stray
  // value doesn't linger. Only rewrites when the param was actually present.
  if (raw !== null) {
    params.delete('lang');
    const newSearch = params.toString();
    const newUrl =
      window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
    try {
      window.history.replaceState({}, '', newUrl);
    } catch {
      /* history may be unavailable in some embeds — non-fatal */
    }
  }
}
