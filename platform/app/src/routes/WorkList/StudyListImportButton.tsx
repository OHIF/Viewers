import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icons } from '@ohif/ui-next';

/**
 * MIMPS-26 — Study-list DICOM import affordance.
 *
 * Relocated from the in-viewer AI panel to the top of the study list, where it
 * belongs: a user with an empty worklist needs to import *before* any study is
 * open (the previous placement was unreachable from an empty list).
 *
 * Clicking navigates to OHIF's built-in `/local` route
 * (platform/app/src/routes/Local/Local.tsx), which wires the
 * DicomLocalDataSource for a fully client-side drag-drop / file-picker import —
 * no upload to Orthanc/PACS.
 *
 * Research-mode gate: the viewer-mode contract (MIMPS-25) persists the chosen
 * mode in sessionStorage under `bv.viewerMode`. Local import is a research-mode
 * affordance, so the button is hidden when the mode is explicitly 'clinical'.
 * It stays visible when the mode is research or not-yet-chosen (the common state
 * on first study-list entry), so the affordance is reachable from an empty list.
 * We read the sessionStorage key directly to avoid coupling platform/app to the
 * blackvoxel-ai extension bundle.
 */

const VIEWER_MODE_KEY = 'bv.viewerMode';

function readViewerMode(): string | null {
  try {
    return sessionStorage.getItem(VIEWER_MODE_KEY);
  } catch {
    // sessionStorage may be blocked in sandboxed frames — degrade to null.
    return null;
  }
}

export function StudyListImportButton(): React.ReactElement | null {
  const { t } = useTranslation('StudyList');
  const navigate = useNavigate();
  const [mode, setMode] = useState<string | null>(() => readViewerMode());

  useEffect(() => {
    // Cross-tab safety; same-tab navigation already remounts the WorkList.
    const onStorage = (e: StorageEvent) => {
      if (e.key === VIEWER_MODE_KEY) {
        setMode(readViewerMode());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Hide only in explicit clinical mode (clinical use is disabled).
  if (mode === 'clinical') {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1"
      onClick={() => navigate('/local')}
      title={t('ImportDICOM')}
    >
      <Icons.Upload className="h-4 w-4" />
      {t('ImportDICOM')}
    </Button>
  );
}

export default StudyListImportButton;
