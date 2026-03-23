/**
 * Standalone ECG Viewer route — renders the full ECG Tools panel
 * outside of the OHIF viewer mode system.
 * Accessible at /ecg-viewer from the WorkList.
 */
import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

const PanelEcgViewer = React.lazy(
  () => import('../../../../../extensions/ecg-tools/src/panels/PanelEcgViewer')
);

export default function EcgViewerRoute() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <div className="flex items-center border-b border-gray-800 bg-gray-900 px-4 py-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-600"
        >
          ← Back to Worklist
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-gray-400">
              Loading ECG Viewer…
            </div>
          }
        >
          <PanelEcgViewer />
        </Suspense>
      </div>
    </div>
  );
}
