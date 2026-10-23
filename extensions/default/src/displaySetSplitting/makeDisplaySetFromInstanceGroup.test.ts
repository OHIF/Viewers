import { makeDisplaySetFromInstanceGroup } from './makeDisplaySetFromInstanceGroup';

/**
 * A small stand-in for the OHIF ImageSet: the factory under test only sets
 * attributes on it and sorts its images.
 */
jest.mock('./makeImageSetDisplaySet', () => {
  // More than one slice is reconstructable; the `instance` is the first image.
  const applyImageListAttributes = imageSet => {
    imageSet.isReconstructable = imageSet.images.length > 1;
    imageSet.instance = imageSet.images[0];
    return {};
  };
  return {
    makeImageSetDisplaySet: instances => {
      const imageSet: Record<string, unknown> = { images: instances, instances };
      imageSet.setAttributes = (attributes: Record<string, unknown>) =>
        Object.assign(imageSet, attributes);
      imageSet.setAttribute = (key: string, value: unknown) => {
        imageSet[key] = value;
      };
      // Records what OHIF's default sort reads, the way `ImageSet.sortInstances`
      // reads `isReconstructable` to choose its order.
      imageSet.sortCalls = [];
      imageSet.sortInstances = list => {
        (imageSet.sortCalls as unknown[]).push(imageSet.isReconstructable);
        return list;
      };
      // The real factory applies the image-list attributes before it returns.
      applyImageListAttributes(imageSet);
      return imageSet;
    },
    applyImageListAttributes,
    applyThumbnailSrc: imageSet => {
      imageSet.thumbnailInstance = imageSet.images[0];
    },
  };
});

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

    it('does not let a __proto__ custom attribute replace the prototype', () => {
      const displaySet = build({
        id: 'proto',
        // JSON.parse makes `__proto__` a real own key.
        customAttributes: () => JSON.parse('{"__proto__": {"x": 1}, "label": "MG"}'),
      });
      expect(Object.getPrototypeOf(displaySet)).toBe(Object.prototype);
      expect(displaySet.x).toBeUndefined();
      expect(displaySet.label).toBe('MG');
    });
  });

  describe('extendInstances', () => {
    const slice = (sop: string, instanceNumber: number) => ({
      ...instance,
      SOPInstanceUID: sop,
      InstanceNumber: instanceNumber,
    });
    // The rule orders by InstanceNumber descending, so the order is visible.
    const descending = {
      id: 'volume3d',
      compareInstances: (a, b) => b.InstanceNumber - a.InstanceNumber,
    };

    it('sorts a grown display set with the reconstructability of the grown list', () => {
      const displaySet = makeDisplaySetFromInstanceGroup(
        { instances: [slice('sop-1', 1)], matchedRule: descending, splitKey: 'k' } as never,
        { splitNumber: 0 },
        context
      ) as unknown as Record<string, unknown>;
      expect(displaySet.sortCalls).toEqual([false]);

      (displaySet.extendInstances as (list: unknown[]) => unknown)([
        slice('sop-2', 2),
        slice('sop-3', 3),
      ]);
      // The sort saw a reconstructable display set, the same as a fresh load
      // of all three slices.
      expect(displaySet.sortCalls).toEqual([false, true]);
    });

    it('applies the order-dependent attributes from the final order', () => {
      const displaySet = makeDisplaySetFromInstanceGroup(
        {
          instances: [slice('sop-1', 1), slice('sop-2', 2)],
          matchedRule: descending,
          splitKey: 'k',
        } as never,
        { splitNumber: 0 },
        context
      ) as unknown as Record<string, { SOPInstanceUID: string }>;
      expect(displaySet.instance.SOPInstanceUID).toBe('sop-2');
      expect(displaySet.thumbnailInstance.SOPInstanceUID).toBe('sop-2');

      (displaySet.extendInstances as unknown as (list: unknown[]) => unknown)([slice('sop-3', 3)]);
      expect(displaySet.instance.SOPInstanceUID).toBe('sop-3');
      expect(displaySet.thumbnailInstance.SOPInstanceUID).toBe('sop-3');
    });
  });
});
