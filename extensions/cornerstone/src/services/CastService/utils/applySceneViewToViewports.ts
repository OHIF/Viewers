/**
 * Applies sceneview camera/slice poses to the current OHIF viewports.
 * Matches sceneview viewports (View = 3D, Slice with orientation) to display viewports
 * and sets camera/focalPoint/viewUp from the sceneview response.
 * Sceneview is in RAS (3D Slicer); we convert to LPS for Cornerstone/DICOM.
 *
 * Sceneview response shape: { response?: { viewports?: Array<{ type, orientation?, camera?, sliceToRAS? }> } }
 */

const LOG_PREFIX = 'applySceneViewToViewports';

/** RAS (Slicer) -> LPS (DICOM/Cornerstone): negate x, y */
function rasToLps([x, y, z]: [number, number, number]): [number, number, number] {
  return [-x, -y, z];
}

export function applySceneViewToViewports(
  servicesManager: AppTypes.ServicesManager,
  sceneViewData: {
    response?: {
      viewports?: Array<{
        type: string;
        orientation?: string;
        camera?: { position?: string; focalPoint?: string; viewUp?: string };
        sliceToRAS?: string;
      }>;
    };
  }
): void {
  const viewports = sceneViewData?.response?.viewports;
  if (!Array.isArray(viewports) || viewports.length === 0) {
    console.debug(LOG_PREFIX, 'no viewports in sceneview');
    return;
  }

  const viewportGridService = servicesManager.services.viewportGridService;
  const cornerstoneViewportService = servicesManager.services.cornerstoneViewportService;
  if (!viewportGridService || !cornerstoneViewportService) {
    console.debug(LOG_PREFIX, 'missing viewportGridService or cornerstoneViewportService');
    return;
  }

  const state = viewportGridService.getState();
  const gridViewports = state.viewports;
  if (!gridViewports) {
    return;
  }

  type ViewportEntry = {
    viewportId: string;
    effectiveOrientation: string;
    csViewport: { type: string; setCamera: (o: object) => void; render: () => void };
  };

  const displayed: ViewportEntry[] = [];
  for (const [id, gridViewport] of gridViewports.entries()) {
    const csViewport = cornerstoneViewportService.getCornerstoneViewport(id);
    if (csViewport && typeof csViewport.setCamera === 'function' && typeof csViewport.render === 'function') {
      const gridOr = (gridViewport as { viewportOptions?: { orientation?: string } }).viewportOptions?.orientation;
      const csOr = typeof cornerstoneViewportService.getOrientation === 'function'
        ? cornerstoneViewportService.getOrientation(id)
        : '';
      const effectiveOrientation = (gridOr ?? csOr ?? '').toLowerCase();
      displayed.push({
        viewportId: id,
        effectiveOrientation,
        csViewport: csViewport as { type: string; setCamera: (o: object) => void; render: () => void },
      });
    }
  }

  console.debug(LOG_PREFIX, 'displayed viewports', displayed.map(e => ({
    id: e.viewportId,
    type: e.csViewport.type,
    effectiveOrientation: e.effectiveOrientation,
  })));

  const orientationNorm = (s: string | undefined) => (s ?? '').toLowerCase();

  for (const sv of viewports) {
    if (sv.type === 'View') {
      const entry = displayed.find(e => e.csViewport.type === 'volume3d');
      if (!entry || !sv.camera) {
        if (!entry) console.debug(LOG_PREFIX, 'View: no VOLUME_3D viewport');
        continue;
      }
      const posRas = parseTriple(sv.camera.position);
      const focRas = parseTriple(sv.camera.focalPoint);
      const upRas = parseTriple(sv.camera.viewUp);
      const fovRas = parseTriple((sv as { fieldOfView?: string }).fieldOfView);
      if (posRas && focRas && upRas) {
        const position = rasToLps(posRas);
        const focalPoint = rasToLps(focRas);
        const viewUp = rasToLps(upRas);
        const cameraOpts: {
          position: [number, number, number];
          focalPoint: [number, number, number];
          viewUp: [number, number, number];
          parallelScale?: number;
        } = { position, focalPoint, viewUp };
        if (fovRas) {
          const fovY = fovRas[1];
          if (!Number.isNaN(fovY) && fovY > 0) {
            cameraOpts.parallelScale = fovY / 2;
          }
        }
        console.debug(LOG_PREFIX, 'View ->', entry.viewportId, {
          ras: { position: posRas, focalPoint: focRas, viewUp: upRas, fieldOfView: fovRas },
          lps: { position, focalPoint, viewUp, parallelScale: cameraOpts.parallelScale },
        });
        entry.csViewport.setCamera(cameraOpts);
        entry.csViewport.render();
      }
      continue;
    }

    if (sv.type === 'Slice' && sv.orientation && sv.sliceToRAS) {
      const svOr = orientationNorm(sv.orientation);
      const parsed = parseSliceToRAS(sv.sliceToRAS);
      if (!parsed.position || !parsed.focalPoint || !parsed.viewUp || !parsed.normal) {
        continue;
      }

      // For slice sceneviews, only match against 2D/orthographic viewports (exclude 3D volume).
      const sliceCandidates = displayed.filter(e => {
        const type = (e.csViewport.type as string)?.toLowerCase();
        return type !== 'volume3d';
      });

      let entry = sliceCandidates.find(e => e.effectiveOrientation === svOr);
      if (!entry && parsed.normal) {
        const normalLps = rasToLps(parsed.normal);
        let best: { entry: ViewportEntry; dot: number } | null = null;
        for (const e of sliceCandidates) {
          const cam = (e.csViewport as { getCamera?: () => { viewPlaneNormal?: number[] } }).getCamera?.();
          const vpn = cam?.viewPlaneNormal as [number, number, number] | undefined;
          if (!vpn || vpn.length < 3) continue;
          const dot = Math.abs(
            normalLps[0] * vpn[0] + normalLps[1] * vpn[1] + normalLps[2] * vpn[2]
          );
          if (dot > 0.9 && (!best || dot > best.dot)) {
            best = { entry: e, dot };
          }
        }
        if (best) {
          entry = best.entry;
          console.debug(LOG_PREFIX, 'Slice', sv.orientation, 'matched by viewPlaneNormal ->', entry.viewportId);
        }
      }
      if (!entry) {
        console.debug(LOG_PREFIX, 'Slice', sv.orientation, 'no matching viewport (orientation)', svOr);
        continue;
      }
      const focalPoint = rasToLps(parsed.focalPoint);
      const viewUp = rasToLps(parsed.viewUp);
      const position = rasToLps(parsed.position);
      const cameraOpts = { position, focalPoint, viewUp };
      console.debug(LOG_PREFIX, 'Slice', sv.orientation, '->', entry.viewportId, {
        ras: { position: parsed.position, focalPoint: parsed.focalPoint, viewUp: parsed.viewUp },
        lps: { position, focalPoint, viewUp },
      });
      entry.csViewport.setCamera(cameraOpts);
      // Sagittal and coronal end up mirrored left-right vs 3D Slicer. setCamera applies flip
      // before pose when both are in one call, so apply a horizontal flip in a second call so it
      // uses the pose we just set.
      if (svOr === 'sagittal' || svOr === 'coronal') {
        entry.csViewport.setCamera({ flipHorizontal: true });
      }
      entry.csViewport.render();
    }
  }
}

function parseTriple(s: string | undefined): [number, number, number] | null {
  if (typeof s !== 'string') return null;
  const parts = s.trim().split(/\s+/).map(Number);
  if (parts.length < 3 || parts.some(n => Number.isNaN(n))) return null;
  return [parts[0], parts[1], parts[2]];
}

function parseSliceToRAS(
  sliceToRAS: string
): {
  position: [number, number, number] | null;
  focalPoint: [number, number, number] | null;
  viewUp: [number, number, number] | null;
  normal: [number, number, number] | null;
} {
  const nums = sliceToRAS.trim().split(/\s+/).map(Number);
  if (nums.length < 12) {
    return { position: null, focalPoint: null, viewUp: null, normal: null };
  }
  const r = (i: number, j: number) => nums[i * 4 + j];
  const focalPoint: [number, number, number] = [r(0, 3), r(1, 3), r(2, 3)];
  const normal: [number, number, number] = [r(0, 2), r(1, 2), r(2, 2)];
  const viewUp: [number, number, number] = [r(0, 1), r(1, 1), r(2, 1)];
  const distance = 100;
  // Camera on the side opposite the slice normal (looking into the slice)
  const position: [number, number, number] = [
    focalPoint[0] - distance * normal[0],
    focalPoint[1] - distance * normal[1],
    focalPoint[2] - distance * normal[2],
  ];
  return { position, focalPoint, viewUp, normal };
}
