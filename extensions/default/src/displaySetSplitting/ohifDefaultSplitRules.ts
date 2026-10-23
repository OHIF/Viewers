/**
 * OHIF's default display-set split rules, as a `@cornerstonejs/metadata` raw
 * selector: rules as pure data, compiled by `createDisplaySetSplitRules`.
 *
 * The rules are data so that a server indexing a study and a viewer splitting
 * a series can read the same rules, and so that a customization (a JSONC URL
 * module, a JSON app config) edits them in the same vocabulary. The only code
 * is one context entry, `isStackImage` ({@link isStackImageInstance}), which
 * the customization supplies to the compiler through
 * {@link ohifDisplaySetContext}. It replaces the `isStackImage` entry of the
 * `@cornerstonejs/metadata` default context.
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
  displaySetRules,
} from '@cornerstonejs/metadata';
import type {
  NaturalizedInstance,
  DisplaySetRules,
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
 * `isStackImage` context entry.
 *
 * Split rules run BEFORE any SOP class routing, so a rule that matched on
 * pixel-data signals alone (`Rows`, `NumberOfFrames`) would claim instances the
 * legacy loop routes elsewhere: SEG, RT Dose and Parametric Map are multiframe
 * image objects with `Rows`, but belong to `cornerstone-dicom-seg` /
 * `cornerstone-dicom-pmap`.  Gating on the stack handler's own SOP class list
 * reproduces the legacy routing exactly. The stack list also holds two SOP
 * classes that upstream's `isImageInstance` list does not: Corneal Topography
 * Map and RT Dose.
 */
export const isStackImageInstance = (instance: NaturalizedInstance) =>
  !isSpecializedInstance(instance) && isStackHandledInstance(instance);

/**
 * The context entries the OHIF rules read, for
 * `createDisplaySetSplitRules(selector, { displaySetContext })`.
 */
export const ohifDisplaySetContext = {
  isStackImage: isStackImageInstance,
};

/**
 * An upstream rule reused under its upstream id, behind the stack-ownership
 * guard and with the OHIF priority.
 *
 * Both reused rules also test `isImage`, which narrows what they claim
 * relative to the guard. Every MR, CT, PT and NM SOP class is on both lists, so
 * that changes nothing for these two rules.
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
const reuseUpstreamRule = (ruleId: string, priority: number): DisplaySetRules => {
  const upstream = displaySetRules[ruleId];
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
    matches: { ...(upstream.matches as Record<string, unknown>), isStackImage: true },
  };
  return { [ruleId]: rule };
};

/**
 * The OHIF default split rules for the `useMetadataDisplaySet` customization,
 * keyed by rule id.
 *
 * Every rule is gated on the `isStackImage` context entry, so the set claims exactly
 * the instances the stack SOP class handler would have claimed — no more
 * (SEG / RT Structure Set / Parametric Map / SR / PDF / video / whole-slide /
 * ECG stay with their dedicated handlers) and no less. The upstream
 * `unsupported` catch-all is not in the set, so everything else is left
 * unmatched for the legacy SOP class handler loop.
 *
 * Rules are evaluated in ascending `priority`, and the first matching rule
 * wins per instance. The defaults use the priorities `1..n`, fixed per rule, so
 * a customization that places a rule between two defaults (priority `2.5`, say)
 * keeps its place even when a reused upstream rule is missing. A priority
 * below `0` runs before every default, above `DEFAULT_SPLIT_RULE_PRIORITY_LIMIT`
 * (10000) after every default, and `null` turns a default rule off.
 */
export const ohifDefaultSplitRules: DisplaySetRules = {
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
    matches: { Modality: ['CR', 'DX', 'MG'], isStackImage: true },
    groupBy: ['SeriesInstanceUID', 'SOPInstanceUID'],
    attributes: {
      instanceNumber: 'InstanceNumber',
      acquisitionDatetime: 'AcquisitionDateTime',
    },
  },

  multiFrame: {
    priority: 2,
    description:
      'Any stack image with NumberOfFrames > 1 - one display set per instance. The ' +
      'upstream rule also requires SliceLocation, which collapses ultrasound clips ' +
      'into one stack.',
    viewportTypes: ['stack'],
    matches: { isMultiFrame: true, isStackImage: true },
    groupBy: ['SeriesInstanceUID', 'SOPInstanceUID'],
    attributes: {
      numImageFrames: { expression: 'Number(NumberOfFrames)' },
      instanceNumber: 'InstanceNumber',
      acquisitionDatetime: 'AcquisitionDateTime',
    },
  },

  ...reuseUpstreamRule('mixedDimensionalityBValue', 3),
  ...reuseUpstreamRule('volume3d', 4),

  defaultImageRule: {
    priority: 5,
    description:
      'Catch-all - one stack display set per series for every remaining instance ' +
      'the stack handler owns. Replaces the upstream rule, which also requires ' +
      'Rows and rejects Corneal Topography Map and RT Dose.',
    viewportTypes: ['stack', 'volume', 'volume3d'],
    matches: { isStackImage: true },
    groupBy: ['SeriesInstanceUID'],
  },
};
