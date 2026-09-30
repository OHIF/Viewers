import { makeDisplaySetFromInstanceGroup } from './makeDisplaySetFromInstanceGroup';

/**
 * A small stand-in for the OHIF ImageSet: the factory under test only sets
 * attributes on it and sorts its images.
 */
jest.mock('./makeImageSetDisplaySet', () => ({
  makeImageSetDisplaySet: instances => {
    const imageSet: Record<string, unknown> = { images: instances, instances };
    imageSet.setAttributes = (attributes: Record<string, unknown>) =>
      Object.assign(imageSet, attributes);
    imageSet.setAttribute = (key: string, value: unknown) => {
      imageSet[key] = value;
    };
    imageSet.sortInstances = list => list;
    return imageSet;
  },
  applyImageListAttributes: () => ({}),
  applyThumbnailSrc: () => undefined,
}));

const context = {
  servicesManager: { services: { customizationService: {} } },
  extensionManager: {},
} as never;

const instance = { SOPInstanceUID: 'sop-1', SeriesInstanceUID: 'series-1', Modality: 'MG' };

const build = (matchedRule: Record<string, unknown>) =>
  makeDisplaySetFromInstanceGroup(
    { instances: [instance], matchedRule, splitKey: '["r","series-1"]' } as never,
    { splitNumber: 0 },
    context
  ) as unknown as Record<string, unknown>;

describe('makeDisplaySetFromInstanceGroup', () => {
  describe('splitRuleId and splitGroupId', () => {
    it('records the rule id, and the rule id as the group when the rule names no group', () => {
      const displaySet = build({ id: 'volume3d' });
      expect(displaySet.splitRuleId).toBe('volume3d');
      expect(displaySet.splitGroupId).toBe('volume3d');
    });

    it('records the group id of the rule, so several rules can share one group', () => {
      const tomo = build({ id: 'mgTomo', groupId: 'mammo' });
      const legacy = build({ id: 'mgLegacy', groupId: 'mammo' });
      expect([tomo.splitRuleId, legacy.splitRuleId]).toEqual(['mgTomo', 'mgLegacy']);
      expect([tomo.splitGroupId, legacy.splitGroupId]).toEqual(['mammo', 'mammo']);
    });

    it('does not let customAttributes overwrite splitRuleId, splitGroupId or splitKey', () => {
      const displaySet = build({
        id: 'mgTomo',
        groupId: 'mammo',
        customAttributes: () => ({
          splitRuleId: 'other',
          splitGroupId: 'other',
          splitKey: 'other',
          label: 'MG',
        }),
      });
      expect(displaySet.splitRuleId).toBe('mgTomo');
      expect(displaySet.splitGroupId).toBe('mammo');
      expect(displaySet.splitKey).toBe('["r","series-1"]');
      // The other attributes still apply.
      expect(displaySet.label).toBe('MG');
    });
  });
});
