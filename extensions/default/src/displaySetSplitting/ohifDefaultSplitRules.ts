import {
  defaultDisplaySetSplitRules,
  isEcgInstance,
  isVideoInstance,
  isWsiInstance,
} from '@cornerstonejs/metadata';
import type { NaturalizedInstance, SplitRule } from '@cornerstonejs/metadata';
import { isStackHandledInstance } from './stackSopClassUids';

/**
 * Video / whole-slide / ECG instances are handled by dedicated OHIF
 * extensions (dicom-video, dicom-microscopy, ...) whose viewports expect
 * their own display set shapes.  The OHIF split rules never claim them, so
 * they fall through (unmatched) to the legacy SOP class handler loop.
 *
 * Some of these SOP classes ARE in the stack handler's registration list
 * (VL/Video Photographic, endoscopic, ...), so this exclusion is needed on top
 * of {@link isStackHandledInstance}.
 */
const isSpecializedInstance = (instance: NaturalizedInstance) =>
  isVideoInstance(instance) || isWsiInstance(instance) || isEcgInstance(instance);

/**
 * The single ownership test every OHIF split rule applies.
 *
 * Split rules run BEFORE any SOP class routing, so a rule that matched on
 * pixel-data signals alone (`Rows`, `NumberOfFrames`) would claim instances the
 * legacy loop routes elsewhere: SEG, RT Dose and Parametric Map are multiframe
 * image objects with `Rows`, but belong to `cornerstone-dicom-seg` /
 * `cornerstone-dicom-pmap`.  Gating on the stack handler's own SOP class list
 * reproduces the legacy routing exactly — and picks up the image SOP classes
 * (Ultrasound, NM, RT Image, Enhanced US Volume, ophthalmic, ...) that
 * upstream's `isImageInstance` list omits.
 */
const isStackImageInstance = (instance: NaturalizedInstance) =>
  !isSpecializedInstance(instance) && isStackHandledInstance(instance);

/** Adds the stack-ownership guard in front of a rule's matcher. */
const withStackGuard = (rule: SplitRule): SplitRule => ({
  ...rule,
  matches: (instance, context) =>
    isStackImageInstance(instance) && (rule.matches ? rule.matches(instance, context) : true),
});

/**
 * One display set PER IMAGE for the single-image modalities (CR/DX/MG) —
 * matching the legacy stack handler.  This replaces the upstream
 * `singleImageModality` rule, which buckets by coarse pixel dimensions and
 * would merge same-resolution mammography views (RCC/LCC/RMLO/LMLO) into a
 * single display set.
 */
const singleImagePerInstanceRule: SplitRule = {
  id: 'singleImageModality',
  viewportTypes: ['stack'],
  matches: instance =>
    ['CR', 'DX', 'MG'].includes((instance.Modality as string) ?? '') &&
    isStackImageInstance(instance),
  groupBy: ['SeriesInstanceUID', 'SOPInstanceUID'],
  customAttributes: (_attributes, options) => {
    const [instance] = options.instances;
    return {
      instanceNumber: instance.InstanceNumber,
      acquisitionDatetime: instance.AcquisitionDateTime,
    };
  },
};

/**
 * Legacy-parity multiframe rule: ANY image instance with NumberOfFrames > 1
 * gets its own display set.  The upstream `multiFrame` rule additionally
 * requires `SliceLocation !== undefined`, which would collapse ultrasound
 * clips (US is not a volume modality) into a single stack display set.
 */
const multiFramePerInstanceRule: SplitRule = {
  id: 'multiFrame',
  viewportTypes: ['stack'],
  matches: instance => Number(instance.NumberOfFrames) > 1 && isStackImageInstance(instance),
  groupBy: ['SeriesInstanceUID', 'SOPInstanceUID'],
  customAttributes: (_attributes, options) => {
    const [instance] = options.instances;
    return {
      numImageFrames: Number(instance.NumberOfFrames),
      instanceNumber: instance.InstanceNumber,
      acquisitionDatetime: instance.AcquisitionDateTime,
    };
  },
};

/**
 * Upstream rules reused as-is (behind the stack-ownership guard).
 *
 * Both apply their own `isImageInstance` test internally, which narrows what
 * they claim relative to the guard.  For `mixedDimensionalityBValue` (MR only)
 * that changes nothing — every MR SOP class is on both lists.  For `volume3d`
 * it means NM series drop through to the catch-all instead, which is
 * equivalent; see {@link defaultStackImageRule}.
 *
 * Upstream's `defaultImageRule` is deliberately NOT reused: as the catch-all it
 * has to accept every stack-owned image SOP class, including the ones
 * `isImageInstance` omits, so OHIF authors its own below.
 */
const REUSED_UPSTREAM_RULE_IDS = ['mixedDimensionalityBValue', 'volume3d'];

/**
 * Resolves the reused upstream rules by id.
 *
 * A missing id means `@cornerstonejs/metadata` renamed a default rule.  This
 * warns and skips rather than throwing: this module is imported by
 * `getCustomizationModule`, so a top-level throw would take down the whole
 * `@ohif/extension-default` customization module — and with it the app — over
 * a feature that is OFF by default.  Degrading to a shorter rule list only
 * affects deployments that opted in, and `ohifDefaultSplitRules.test.ts`
 * fails loudly on the drift in CI, which is where a hard failure belongs.
 */
const reusedUpstreamRules = REUSED_UPSTREAM_RULE_IDS.map(ruleId => {
  const rule = defaultDisplaySetSplitRules.find(candidate => candidate.id === ruleId);
  if (!rule) {
    console.warn(
      `ohifDefaultSplitRules: @cornerstonejs/metadata default split rule '${ruleId}' not found - ` +
        `the upstream rule ids changed. Skipping it; display set splitting will be less specific.`
    );
    return undefined;
  }
  return withStackGuard(rule);
}).filter((rule): rule is SplitRule => rule !== undefined);

/**
 * Catch-all: one stack display set per series for every remaining instance the
 * stack handler owns — the legacy behaviour for anything that is not a
 * single-image modality, a multiframe instance, or a recognised volume.
 *
 * Replaces upstream's `defaultImageRule`, whose `isImageInstance` gate rejects
 * Ultrasound, NM, RT Image, Enhanced US Volume and the ophthalmic classes; they
 * would otherwise fall out of the splitter entirely and be picked up by the
 * legacy loop, leaving one series split across both paths.
 *
 * NM series reach this rule rather than `volume3d` for the same reason, which
 * is harmless: both group by `SeriesInstanceUID` and offer the same viewport
 * types, and `isReconstructable` is computed by the display set factory, not by
 * the rule.
 */
const defaultStackImageRule: SplitRule = {
  id: 'defaultImageRule',
  viewportTypes: ['stack', 'volume', 'volume3d'],
  matches: instance => isStackImageInstance(instance),
  groupBy: ['SeriesInstanceUID'],
};

/**
 * The OHIF default split rules for the `useMetadataDisplaySet` customization.
 *
 * Every rule is gated on {@link isStackImageInstance}, so the set claims
 * exactly the instances the stack SOP class handler would have claimed —
 * no more (SEG / RT Structure Set / Parametric Map / SR / PDF / video /
 * whole-slide / ECG stay with their dedicated handlers) and no less (the
 * image SOP classes upstream's `isImageInstance` list omits are included).
 * Everything else is left unmatched for the legacy SOP class handler loop.
 *
 * Evaluated in order, first matching rule wins per instance.
 */
export const ohifDefaultSplitRules: SplitRule[] = [
  singleImagePerInstanceRule,
  multiFramePerInstanceRule,
  ...reusedUpstreamRules,
  defaultStackImageRule,
];
