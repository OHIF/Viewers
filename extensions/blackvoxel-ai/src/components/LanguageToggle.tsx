/**
 * I18N-04 — LanguageToggle
 *
 * A compact PT / EN toggle reachable inside the viewer. On change it switches
 * i18next (which persists via the LanguageDetector cache — localStorage
 * 'i18nextLng' + cookie) so the choice survives in-app navigation and reload.
 *
 * Designed to be dropped into the AI panel header. Styled with the extension's
 * brand tokens (matches AIFindingsPanel / ViewerModeGate).
 */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { OHIF_LOCALE_PT, OHIF_LOCALE_EN } from '../i18n';

const TEXT_SECONDARY = '#A0ADB4';

/** True when the active i18next language is a Portuguese variant. */
function isPt(lng: string | undefined): boolean {
  return !!lng && lng.toLowerCase().startsWith('pt');
}

export function LanguageToggle(): React.ReactElement {
  const { i18n, t } = useTranslation('blackvoxel-ai');
  const pt = isPt(i18n.language);

  const setLang = useCallback(
    (locale: string) => {
      if (i18n.language !== locale) {
        i18n.changeLanguage(locale);
      }
    },
    [i18n]
  );

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '2px 7px',
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.4,
    borderRadius: 4,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: active ? 'rgba(124,58,237,0.30)' : 'transparent',
    color: active ? '#C4B5FD' : TEXT_SECONDARY,
    transition: 'background-color 120ms, color 120ms',
  });

  return (
    <div
      role="group"
      aria-label={t('lang.toggleAria')}
      className="flex items-center gap-0.5 rounded"
      style={{ border: '1px solid rgba(255,255,255,0.10)', padding: 1 }}
    >
      <button
        type="button"
        onClick={() => setLang(OHIF_LOCALE_PT)}
        aria-pressed={pt}
        style={pill(pt)}
        title="Português"
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => setLang(OHIF_LOCALE_EN)}
        aria-pressed={!pt}
        style={pill(!pt)}
        title="English"
      >
        EN
      </button>
    </div>
  );
}

export default LanguageToggle;
