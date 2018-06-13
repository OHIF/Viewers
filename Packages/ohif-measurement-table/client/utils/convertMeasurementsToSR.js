import {
    parametersFromImageId,
    parametersFromToolState } from './srUtilities';

const sopClassUid = dcmjs.data.DicomMetaDictionary.sopClassUIDsByName["CTImage"];

const measurementGroupContentItem = (measurement) => {
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

const convertMeasurementsToSR = (measurements) => {
    
    const { studyInstanceUid, seriesInstanceUid, sopInstanceUid } = measurements.allTools[0];
    
    // TODO: figure out what is needed to make a dcmjs dataset from
    // information available in the viewer.  Apparently the raw dicom is not available
    // directly.
    const derivationSourceDataset = {
        StudyInstanceUID: studyInstanceUid,
        SeriesInstanceUID: seriesInstanceUid,
        SOPInstanceUID: sopInstanceUid,
        SOPClassUID: sopClassUid
    };
    report = new dcmjs.derivations.StructuredReport([derivationSourceDataset]);
    dataset = report.dataset;
    
    // TODO: what is the correct metaheader
    // http://dicom.nema.org/medical/Dicom/current/output/chtml/part10/chapter_7.html
    // TODO: move meta creation to dcmjs
    const fileMetaInformationVersionArray = new Uint16Array(1);
    fileMetaInformationVersionArray[0] = 1;
    dataset._meta = {
        FileMetaInformationVersion: fileMetaInformationVersionArray.buffer,
        MediaStorageSOPClassUID: dataset.SOPClassUID,
        MediaStorageSOPInstanceUID: dataset.SOPInstanceUID,
        TransferSyntaxUID: "1.2.840.10008.1.2.1", // Explicit little endian (always for dcmjs?)
        ImplementationClassUID: dcmjs.data.DicomMetaDictionary.uid(), // TODO: could be git hash or other valid id
        ImplementationVersionName: "OHIFViewer"
    };
    
    // TODO: factor out a lot of this back into dcmjs for use in both
    // the example and in the Viewer
    const measurementGroupContentSequence = [];
    for (measurement of measurements.allTools) {
        measurementGroupContentSequence.push.apply(measurementGroupContentSequence, measurementGroupContentItem(measurement));
    }
    
    
    // TODO: make a TID1550 derivation as an SR subclass
    dataset = Object.assign(dataset, {
        ConceptNameCodeSequence: {
            CodeValue: '126000',
            CodingSchemeDesignator: 'DCM',
            CodeMeaning: 'Imaging Measurement Report'
        },
        ContinuityOfContent: 'SEPARATE',
        PerformedProcedureCodeSequence: [],
        CompletionFlag: 'COMPLETE',
        VerificationFlag: 'UNVERIFIED',
        ReferencedPerformedProcedureStepSequence: [],
        InstanceNumber: 1,
        CurrentRequestedProcedureEvidenceSequence: {
            StudyInstanceUID: dataset.StudyInstanceUID,
            ReferencedSeriesSequence: {
                SeriesInstanceUID: dataset.SeriesInstanceUID,
                ReferencedSOPSequence: {
                    ReferencedSOPClassUID: derivationSourceDataset.SOPClassUID,
                    ReferencedSOPInstanceUID: derivationSourceDataset.SOPInstanceUID
                },
            },
        },
        CodingSchemeIdentificationSequence: {
            CodingSchemeDesignator: "99dcmjs",
            CodingSchemeName: "Codes used for dcmjs",
            CodingSchemeVersion: "0",
            CodingSchemeResponsibleOrganization: "https://github.com/pieper/dcmjs"
        },
        ContentTemplateSequence: {
            MappingResource: 'DCMR',
            TemplateIdentifier: '1500'
        },
        ContentSequence: [
            {
                RelationshipType: 'HAS CONCEPT MOD',
                ValueType: 'CODE',
                ConceptNameCodeSequence: {
                    CodeValue: '121049',
                    CodingSchemeDesignator: 'DCM',
                    CodeMeaning: 'Language of Content Item and Descendants',
                },
                ConceptCodeSequence: {
                    CodeValue: 'eng',
                    CodingSchemeDesignator: 'RFC3066',
                    CodeMeaning: 'English',
                },
                ContentSequence: {
                    RelationshipType: 'HAS CONCEPT MOD',
                    ValueType: 'CODE',
                    ConceptNameCodeSequence: {
                        CodeValue: '121046',
                        CodingSchemeDesignator: 'DCM',
                        CodeMeaning: 'Country of Language',
                    },
                    ConceptCodeSequence: {
                        CodeValue: 'US',
                        CodingSchemeDesignator: 'ISO3166_1',
                        CodeMeaning: 'United States',
                    }
                }
            },
            {
                RelationshipType: 'HAS OBS CONTEXT',
                ValueType: 'PNAME',
                ConceptNameCodeSequence: {
                    CodeValue: '121008',
                    CodingSchemeDesignator: 'DCM',
                    CodeMeaning: 'Person Observer Name',
                },
                PersonName: 'user^web' // TODO: these can be options argument for constructor
            },
            {
                RelationshipType: 'HAS OBS CONTEXT',
                ValueType: 'TEXT',
                ConceptNameCodeSequence: {
                    CodeValue: 'RP-100006',
                    CodingSchemeDesignator: '99dcmjs',
                    CodeMeaning: "Person Observer's Login Name"
                },
                TextValue: 'user'
            },
            {
                RelationshipType: 'HAS CONCEPT MOD',
                ValueType: 'CODE',
                ConceptNameCodeSequence: {
                    CodeValue: '121058',
                    CodingSchemeDesignator: 'DCM',
                    CodeMeaning: 'Procedure reported'
                },
                ConceptCodeSequence: {
                    CodeValue: '1',
                    CodingSchemeDesignator: '99dcmjs',
                    CodeMeaning: 'Unknown procedure'
                },
            },
            {
                RelationshipType: 'CONTAINS',
                ValueType: 'CONTAINER',
                ConceptNameCodeSequence: {
                    CodeValue: '111028',
                    CodingSchemeDesignator: 'DCM',
                    CodeMeaning: 'Image Library',
                },
                ContinuityOfContent: 'SEPARATE',
                ContentSequence: {
                    RelationshipType: 'CONTAINS',
                    ValueType: 'CONTAINER',
                    ConceptNameCodeSequence: {
                        CodeValue: '126200',
                        CodingSchemeDesignator: 'DCM',
                        CodeMeaning: 'Image Library Group',
                    },
                    ContinuityOfContent: 'SEPARATE',
                    ContentSequence: {
                        RelationshipType: 'CONTAINS',
                        ValueType: 'IMAGE',
                        ReferencedSOPSequence: {
                            // TODO: this should refer to the UIDs extracted from the toolState / instance info
                            ReferencedSOPClassUID: dataset.SOPClassUID,
                            ReferencedSOPInstanceUID: dataset.SOPInstanceUID,
                        },
                    },
                },
            },
            {
                RelationshipType: 'CONTAINS',
                ValueType: 'CONTAINER',
                ConceptNameCodeSequence: {
                    CodeValue: '126010',
                    CodingSchemeDesignator: 'DCM',
                    CodeMeaning: 'Imaging Measurements',  // TODO: would be nice to abstract the code sequences (in a dictionary? a service?)
                },
                ContinuityOfContent: 'SEPARATE',
                ContentSequence: {
                    RelationshipType: 'CONTAINS',
                    ValueType: 'CONTAINER',
                    ConceptNameCodeSequence: {
                        CodeValue: '125007',
                        CodingSchemeDesignator: 'DCM',
                        CodeMeaning: 'Measurement Group',
                    },
                    ContinuityOfContent: 'SEPARATE',
                    ContentSequence: measurementGroupContentSequence,
                },
            },
        ]
    });
    
    return dataset;
}

export {
    convertMeasurementsToSR
}
