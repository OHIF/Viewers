import {
  defaultDisplaySetSplitRules,
  isEcgInstance,
  isImageInstance,
  isVideoInstance,
  isWsiInstance,
} from '@cornerstonejs/metadata';
import type { NaturalizedInstance, SplitRule } from '@cornerstonejs/metadata';

/**
 * Video / whole-slide / ECG instances are handled by dedicated OHIF
 * extensions (dicom-video, dicom-microscopy, ...) whose viewports expect
 * their own display set shapes.  The OHIF split rules never claim them, so
 * they fall through (unmatched) to the legacy SOP class handler loop.
 */
const isSpecializedInstance = (instance: NaturalizedInstance) =>
  isVideoInstance(instance) || isWsiInstance(instance) || isEcgInstance(instance);

/** Adds the specialized-instance guard in front of a rule's matcher. */
const withSpecializedGuard = (rule: SplitRule): SplitRule => ({
  ...rule,
  matches: (instance, context) =>
    !isSpecializedInstance(instance) && (rule.matches ? rule.matches(instance, context) : true),
});

/**
 * One display set PER IMAGE for the single-image modalities (CR/DX/MG) —
 * matching the legacy stack handler.  This replaces the upstream
 * `singleImageModality` rule, which buckets by coarse pixel dimensions and
 * would merge same-resolution mammography views (RCC/LCC/RMLO/LMLO) into a
 * single display set.
 */
/**
 * The upstream `isImageInstance` SOP class list misses some image storage
 * classes (e.g. Digital Mammography, Ultrasound) — accept `Rows` as an
 * alternative image signal, mirroring the legacy stack handler's
 * `isImage(SOPClassUID) || Rows` gate.
 */
const isImageLikeInstance = (instance: NaturalizedInstance) =>
  isImageInstance(instance) || !!instance.Rows;

const singleImagePerInstanceRule: SplitRule = {
  id: 'singleImageModality',
  viewportTypes: ['stack'],
  matches: instance =>
    ['CR', 'DX', 'MG'].includes((instance.Modality as string) ?? '') &&
    isImageLikeInstance(instance) &&
    !isSpecializedInstance(instance),
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
  matches: instance =>
    Number(instance.NumberOfFrames) > 1 &&
    isImageLikeInstance(instance) &&
    !isSpecializedInstance(instance),
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

/** Upstream rules reused as-is (behind the specialized-instance guard). */
const REUSED_UPSTREAM_RULE_IDS = ['mixedDimensionalityBValue', 'volume3d', 'defaultImageRule'];

const reusedUpstreamRules = REUSED_UPSTREAM_RULE_IDS.map(ruleId => {
  const rule = defaultDisplaySetSplitRules.find(candidate => candidate.id === ruleId);
  if (!rule) {
    throw new Error(
      `@cornerstonejs/metadata default split rule '${ruleId}' not found - the upstream rule ids changed`
    );
  }
  return withSpecializedGuard(rule);
});

/**
 * The OHIF default split rules for the `useMetadataDisplaySet` customization.
 * Image rules only — video/ECG/whole-slide (and every non-image SOP class,
 * e.g. SEG/SR/RT/PDF) are left unmatched so they reach their dedicated SOP
 * class handlers through the legacy loop.
 *
 * Evaluated in order, first matching rule wins per instance.
 */
export const ohifDefaultSplitRules: SplitRule[] = [
  singleImagePerInstanceRule,
  multiFramePerInstanceRule,
  ...reusedUpstreamRules,
];
