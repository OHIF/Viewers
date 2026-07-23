import { isNextViewportsEnabled } from './nextViewports';

/**
 * The named home for every BEHAVIORAL POLICY difference between the legacy and
 * native ("next") viewport paths — appearance defaults and workflow rules that
 * are not API bridging (that's `services/ViewportService/adapter/`) and not
 * mount lifecycle (that's `services/ViewportService/backends/`). Keeping them
 * in one greppable file is the point: a policy divergence that lives inline in
 * a mode or hanging protocol is invisible to the next reader.
 */

/**
 * Initial PT opacity for TMTV fusion viewports on the native path. Legacy (in
 * tmtv's hpViewports) uses a per-value opacity ramp; native applies a ramp
 * literally through its flat 2D blend (which would keep the background
 * transparent), so the native path replaces the ramp with this single flat,
 * more CT-weighted starting blend.
 */
export const NEXT_FUSION_PT_OPACITY = 0.4;

/**
 * Initial opacity for data overlays (e.g. colormapped foreground layers) on
 * the native path. Native viewports composite an overlay as a 2D image slice
 * with a flat alpha blend and no volume ray-cast opacity attenuation: the
 * legacy nominal 0.9 renders at ~40% effective through the ray-cast path but
 * reads ~80-90% on native, so native starts at the legacy-equivalent
 * effective value.
 */
export const NEXT_OVERLAY_OPACITY = 0.4;

/**
 * Viewport type to pin when hydrating a segmentation's referenced display set.
 * RTSTRUCT contours render correctly on a native stack/vtkImage viewport and
 * scroll fast, so the referenced image stays in stack mode on hydrate rather
 * than being promoted to a volume slice (which the perf acceptance criteria
 * forbid). Scoped to RTSTRUCT + the next path; SEG and legacy keep the default
 * (undefined = no pin).
 */
export function getHydrationViewportTypeForModality(modality: string): 'stack' | undefined {
  return modality === 'RTSTRUCT' && isNextViewportsEnabled() ? 'stack' : undefined;
}
