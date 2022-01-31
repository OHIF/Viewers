const getCoordsFromSCOORDOrSCOORD3D = (graphicItem, displaySet) => {
  const { ValueType, RelationshipType, GraphicType, GraphicData } = graphicItem;

  // if (RelationshipType !== RELATIONSHIP_TYPE.INFERRED_FROM) {
  //   console.warn(
  //     `Relationshiptype === ${RelationshipType}. Cannot deal with NON TID-1400 SCOORD group with RelationshipType !== "INFERRED FROM."`
  //   );
  //   return;
  // }

  const coords = { ValueType, GraphicType, GraphicData };

  // ContentSequence has length of 1 as RelationshipType === 'INFERRED FROM'
  if (ValueType === 'SCOORD') {
    const { ReferencedSOPSequence } = graphicItem.ContentSequence;
    coords.ReferencedSOPSequence = ReferencedSOPSequence;
  } else if (ValueType === 'SCOORD3D') {
    if (graphicItem.ReferencedFrameOfReferenceUID) {
      coords.ReferencedFrameOfReferenceSequence = graphicItem.ReferencedFrameOfReferenceUID;
    } else if (graphicItem.ContentSequence) {
      const {
        ReferencedFrameOfReferenceSequence,
      } = graphicItem.ContentSequence;
      coords.ReferencedFrameOfReferenceSequence = ReferencedFrameOfReferenceSequence;
    }
  }

  return coords;
};

export default getCoordsFromSCOORDOrSCOORD3D;
