/**
 * MIMPS-26 — DicomImportButton
 *
 * A self-contained button that lets a user load local DICOM files into the
 * viewer by navigating to OHIF's existing `/local` route.  The button is only
 * rendered / enabled when the active viewer mode is 'research'.
 *
 * Design decisions:
 *   - Reuses OHIF's `/local` route (platform/app/src/routes/Local/Local.tsx)
 *     which already wires the DicomLocalDataSource (drag-drop / file-picker,
 *     fully client-side — no upload to Orthanc/PACS).
 *   - Navigates via react-router-dom's useNavigate so the SPA router handles
 *     the transition correctly inside the running OHIF shell.
 *   - Gated with useViewerMode() from the MIMPS-25 store — hidden entirely
 *     when mode !== 'research' so non-research users never see the affordance.
 *   - No core/platform modifications: the button lives exclusively inside the
 *     blackvoxel-ai extension, rendered from the AI panel header area.
 *   - Bilingual (pt-BR primary), styled with the extension's brand tokens.
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewerMode } from '../stores/useViewerModeStore';

// ---------------------------------------------------------------------------
// Brand tokens (shared with AIFindingsPanel.tsx / ViewerModeGate.tsx)
// ---------------------------------------------------------------------------

const BRAND_VIOLET = '#7C3AED';
const BRAND_VIOLET_HOVER = '#6D28D9';
const TEXT_SECONDARY = '#A0ADB4';

// ---------------------------------------------------------------------------
// Sub-component: Upload icon
// ---------------------------------------------------------------------------

function UploadIcon(): React.ReactElement {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// DicomImportButton
// ---------------------------------------------------------------------------

/**
 * Renders an "Importar DICOM / Import DICOM" button that is only visible when
 * the active viewer mode is 'research'.  Clicking navigates to the OHIF
 * `/local` route which provides the native DICOM file-picker / drag-drop UX.
 *
 * Rendered hidden (returns null) in clinical or unset modes.
 */
export function DicomImportButton(): React.ReactElement | null {
  const { mode } = useViewerMode();
  const navigate = useNavigate();

  const handleImport = useCallback(() => {
    // Navigate to OHIF's built-in local-file loader route.
    // `/local` navigates to the worklist after loading; `/localbasic`
    // navigates directly into the viewer.  We use `/local` so the user
    // lands on the worklist and can then select the study — consistent with
    // the upstream UX and avoids hard-coding a mode path here.
    navigate('/local');
  }, [navigate]);

  // Gate: only render in research mode.
  if (mode !== 'research') {
    return null;
  }

  return (
    <div className="flex-shrink-0 border-b border-white/10 px-3 py-2">
      <button
        type="button"
        onClick={handleImport}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold text-white transition-colors max-md:min-h-[44px]"
        style={{ backgroundColor: BRAND_VIOLET }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = BRAND_VIOLET_HOVER;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = BRAND_VIOLET;
        }}
        // Focus ring
        onFocus={e => {
          (e.currentTarget as HTMLButtonElement).style.outline = `2px solid ${BRAND_VIOLET}`;
          (e.currentTarget as HTMLButtonElement).style.outlineOffset = '2px';
        }}
        onBlur={e => {
          (e.currentTarget as HTMLButtonElement).style.outline = 'none';
        }}
        aria-label="Importar arquivos DICOM locais / Import local DICOM files"
        title="Importar DICOM local — apenas modo Pesquisa / Import local DICOM — Research mode only"
      >
        <UploadIcon />
        Importar DICOM
        <span
          className="ml-1 text-[11px] font-normal"
          style={{ color: 'rgba(255,255,255,0.75)' }}
        >
          / Import DICOM
        </span>
      </button>

      <p
        className="mb-0 mt-1.5 text-center text-[10px] leading-snug"
        style={{ color: TEXT_SECONDARY }}
      >
        Arquivos ficam no navegador — nenhum upload para servidor.
        {' '}
        <span className="opacity-70">Files stay in the browser — no server upload.</span>
      </p>
    </div>
  );
}

export default DicomImportButton;
