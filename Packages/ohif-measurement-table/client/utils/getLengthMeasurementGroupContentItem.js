export default measurementGroupContentItem = (measurement, sopClassUid) => {
    const {
        handles,
        length,
        frameIndex,
        sopInstanceUid
    } = measurement;
    const measurementContentItem = [
        {
            RelationshipType: 'HAS OBS CONTEXT',
            ValueType: 'TEXT',
            ConceptNameCodeSequence: {
                CodeValue: '112039',
                CodingSchemeDesignator: 'DCM',
                CodeMeaning: 'Tracking Identifier',
            },
            TextValue: 'web annotation',
        },
        {
            RelationshipType: 'HAS OBS CONTEXT',
            ValueType: 'UIDREF',
            ConceptNameCodeSequence: {
                CodeValue: '112040',
                CodingSchemeDesignator: 'DCM',
                CodeMeaning: 'Tracking Unique Identifier',
            },
            UID: dcmjs.data.DicomMetaDictionary.uid(),
        },
        {
            RelationshipType: 'CONTAINS',
            ValueType: 'CODE',
            ConceptNameCodeSequence: {
                CodeValue: '121071',
                CodingSchemeDesignator: 'DCM',
                CodeMeaning: 'Finding',
            },
            ConceptCodeSequence: {
                CodeValue: 'SAMPLEFINDING',
                CodingSchemeDesignator: '99dcmjs',
                CodeMeaning: 'Sample Finding',
            },
        },
        {
            RelationshipType: 'CONTAINS',
            ValueType: 'NUM',
            ConceptNameCodeSequence: {
                CodeValue: 'G-D7FE',
                CodingSchemeDesignator: 'SRT',
                CodeMeaning: 'Length',
            },
            MeasuredValueSequence: {
                MeasurementUnitsCodeSequence: {
                    CodeValue: 'mm',
                    CodingSchemeDesignator: 'UCUM',
                    CodingSchemeVersion: '1.4',
                    CodeMeaning: 'millimeter',
                },
                NumericValue: length,
            },
            ContentSequence: {
                RelationshipType: 'INFERRED FROM',
                ValueType: 'SCOORD',
                GraphicType: 'POLYLINE',
                GraphicData: [ handles.start.x, handles.start.y, handles.end.x, handles.end.y ],
                ContentSequence: {
                    RelationshipType: 'SELECTED FROM',
                    ValueType: 'IMAGE',
                    ReferencedSOPSequence: {
                        ReferencedSOPClassUID: sopClassUid,
                        ReferencedSOPInstanceUID: sopInstanceUid,
                        ReferencedFrameNumber: frameIndex,
                    }
                },
            },
        },
    ];
    
    return measurementContentItem;
};