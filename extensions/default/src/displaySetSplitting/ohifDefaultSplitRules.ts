/**
 * OHIF's default display-set split rules, as a `@cornerstonejs/metadata` raw
 * selector: rules as pure data, compiled by `createDisplaySetSplitRules`.
 *
 * The rules are data so that a server indexing a study and a viewer splitting
 * a series can read the same rules, and so that a customization (a JSONC URL
 * module, a JSON app config) edits them in the same vocabulary. The only code
 * is one named classifier, `stackImage` ({@link isStackImageInstance}), which
 * the customization supplies to the compiler through
 * {@link ohifSplitRuleClassifiers}.
 *
 * Each rule exists to reproduce the legacy stack SOP class handler exactly;
 * see the rule descriptions for where that differs from the upstream defaults.
 * The one exception is `singleImageModality`, which is off by default.
 *
 * @module ohifDefaultSplitRules
 */

import {
  isEcgInstance,
  isVideoInstance,
  isWsiInstance,
  rawDisplaySetSelector,
} from '@cornerstonejs/metadata';
import type {
  NaturalizedInstance,
  RawDisplaySetSelector,
  RawSplitRule,
} from '@cornerstonejs/metadata';
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
 * The single ownership test every OHIF split rule applies, registered as the
 * `stackImage` classifier.
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
export const isStackImageInstance = (instance: NaturalizedInstance) =>
  !isSpecializedInstance(instance) && isStackHandledInstance(instance);

/**
 * The named classifiers the OHIF rules reference, for
 * `createDisplaySetSplitRules(selector, { classifiers })`.
 */
export const ohifSplitRuleClassifiers = {
  stackImage: isStackImageInstance,
};

const STACK_IMAGE = { classifier: 'stackImage' };

/**
 * An upstream rule reused under its upstream id, behind the stack-ownership
 * guard and with the OHIF priority.
 *
 * Both reused rules apply their own `isImageInstance` test internally, which
 * narrows what they claim relative to the guard.  For
 * `mixedDimensionalityBValue` (MR only) that changes nothing — every MR SOP
 * class is on both lists.  For `volume3d` it means NM series drop through to
 * the catch-all instead, which is equivalent: both group by
 * `SeriesInstanceUID` and offer the same viewport types.
 *
 * A missing id means `@cornerstonejs/metadata` renamed a default rule.  This
 * warns and leaves the rule out rather than throwing: this module is imported
 * by `getCustomizationModule`, so a top-level throw would take down the whole
 * `@ohif/extension-default` customization module — and with it the app — over
 * a feature that is OFF by default.  `ohifDefaultSplitRules.test.ts` fails
 * loudly on the drift in CI, which is where a hard failure belongs.
 *
 * @returns `{ [ruleId]: rule }`, or `{}` when the upstream rule is missing, so
 *   the result spreads straight into the selector.
 */
const reuseUpstreamRule = (ruleId: string, priority: number): RawDisplaySetSelector => {
  const upstream = rawDisplaySetSelector[ruleId];
  if (!upstream) {
    console.warn(
      `ohifDefaultSplitRules: @cornerstonejs/metadata default split rule '${ruleId}' not found - ` +
        `the upstream rule ids changed. Skipping it; display set splitting will be less specific.`
    );
    return {};
  }
  const rule: RawSplitRule = {
    ...upstream,
    priority,
    matches: upstream.matches ? { all: [STACK_IMAGE, upstream.matches] } : STACK_IMAGE,
  };
  return { [ruleId]: rule };
};

/**
 * The OHIF default split rules for the `useMetadataDisplaySet` customization,
 * keyed by rule id.
 *
 * Every rule is gated on the `stackImage` classifier, so the set claims exactly
 * the instances the stack SOP class handler would have claimed — no more
 * (SEG / RT Structure Set / Parametric Map / SR / PDF / video / whole-slide /
 * ECG stay with their dedicated handlers) and no less (the image SOP classes
 * upstream's `isImageInstance` list omits are included). Everything else is
 * left unmatched for the legacy SOP class handler loop.
 *
 * Rules are evaluated in ascending `priority`, and the first matching rule
 * wins per instance. The defaults use the priorities `1..n`, fixed per rule, so
 * a customization that places a rule between two defaults (priority `2.5`, say)
 * keeps its place even when a reused upstream rule is missing. A priority
 * below `0` runs before every default, above `DEFAULT_SPLIT_RULE_PRIORITY_LIMIT`
 * (10000) after every default, and `null` turns a default rule off.
 */
export const ohifDefaultSplitRules: RawDisplaySetSelector = {
  // Off by default (priority null), which is the one intended difference from
  // the legacy stack handler. A per-image split is a decision for each
  // deployment, and a rule states it better than a fixed modality list: see
  // the `split/dxCrSingleImages` URL module, which splits only small DX and CR
  // series. The rule stays in the set, so that
  // `{ singleImageModality: { priority: { $set: 1 } } }` turns it on again.
  singleImageModality: {
    priority: null,
    description:
      'CR / DX / MG - one display set per image, as the legacy stack handler does. ' +
      'Off by default. The upstream rule buckets by coarse image size, which merges ' +
      'mammography views of the same resolution (RCC/LCC/RMLO/LMLO).',
    viewportTypes: ['stack'],
    matches: { all: [{ attribute: 'Modality', in: ['CR', 'DX', 'MG'] }, STACK_IMAGE] },
    groupBy: ['SeriesInstanceUID', 'SOPInstanceUID'],
    customAttributes: {
      fromFirstInstance: {
        instanceNumber: { attribute: 'InstanceNumber' },
        acquisitionDatetime: { attribute: 'AcquisitionDateTime' },
      },
    },
  },

  multiFrame: {
    priority: 2,
    description:
      'Any stack image with NumberOfFrames > 1 - one display set per instance. The ' +
      'upstream rule also requires SliceLocation, which collapses ultrasound clips ' +
      'into one stack.',
    viewportTypes: ['stack'],
    matches: { all: [{ attribute: 'NumberOfFrames', greaterThan: 1 }, STACK_IMAGE] },
    groupBy: ['SeriesInstanceUID', 'SOPInstanceUID'],
    customAttributes: {
      fromFirstInstance: {
        numImageFrames: { attribute: 'NumberOfFrames', number: true },
        instanceNumber: { attribute: 'InstanceNumber' },
        acquisitionDatetime: { attribute: 'AcquisitionDateTime' },
      },
    },
  },

  ...reuseUpstreamRule('mixedDimensionalityBValue', 3),
  ...reuseUpstreamRule('volume3d', 4),

  defaultImageRule: {
    priority: 5,
    description:
      'Catch-all - one stack display set per series for every remaining instance ' +
      'the stack handler owns. Replaces the upstream rule, whose isImageInstance ' +
      'gate rejects Ultrasound, NM, RT Image, Enhanced US Volume and the ' +
      'ophthalmic classes.',
    viewportTypes: ['stack', 'volume', 'volume3d'],
    matches: STACK_IMAGE,
    groupBy: ['SeriesInstanceUID'],
  },
};
