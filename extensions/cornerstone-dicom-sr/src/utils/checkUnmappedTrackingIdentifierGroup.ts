export default function checkUnmappedTrackingIdentifierGroup(measurementGroupContentSequence) {
    const NUMContentItems = measurementGroupContentSequence.filter(group => group.ValueType === 'NUM');
    if (!NUMContentItems.length) {
      const SCOORDContentItems = measurementGroupContentSequence.filter(group => group.ValueType === 'SCOORD');
      if (SCOORDContentItems) {
        measurementGroupContentSequence[Object.keys(measurementGroupContentSequence).length] = {
          ['ContentSequence'] : SCOORDContentItems,
          ['ValueType'] : 'NUM'
        }
      }
    }
    return {
      cornerstoneTag: 'Cornerstone3DTools@^0.1.0',
      toolName: 'PlanarFreehandROI',
    }
}
