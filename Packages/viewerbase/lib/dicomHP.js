
/**
 * This is a temporary function which will return a hardcoded hanging protocol as a JavaScript object
 * The purpose of this is to act as a stub until we are actually parsing DICOM Hanging Protocol files,
 * since Orthanc doesn't seem to support them yet.
 *
 * Soon we will be using instanceDataToJsObject to produce this object from the HangingProtocol WADO
 * instance
 *
 */
function getMammoHangingProtocol() {
    var tagValues = {
        HangingProtocolStorage: '1.2.840.10008.5.1.4.38.1'
    };

    var protocol = {
        sopClassUid: tagValues.HangingProtocolStorage,
        sopInstanceUid: '1.2.840.113986.2.664566.21121125.85669.911', // A random Uid
        hangingProtocolName: 'MammoCadProtocol',
        hangingProtocolDescription: 'Mammography screening protocol',
        hangingProtocolLevel: 'SITE',
        hangingProtocolCreator: 'Erik',
        hangingProtocolCreationDateTime: '20020101104200',
        hangingProtocolDefinitionSequence: [{
            modality: 'MG',
            laterality: '',
            procedureCodeSequence: {
                codeValue: 98765,
                codingSchemeDesignator: '99Local',
                codingSchemeVersion: 1.5,
                codeMeaning: 'Mammogram'
            },
            anatomicRegionSequence: {
                codeValue: 'T-D1100',
                codingSchemeDesignator: 'SNM3',
                codeMeaning: 'BREAST'
            },
            reasonForRequestedProcedureCodeSequence: {
                codeValue: 'I67.1',
                codingSchemeDesignator: 'I10',
                codeMeaning: 'Calcification'
            }
        }],
        hangingProtocolUserIdentificationCodeSequence: [],
        hangingProtocolUserGroupName: 'ABC Hospital',
        numberOfPriorsReferenced: 1,
        imageSetsSequence: [{
            imageSetSelectorSequence: [{
                ImageSetSelectorUsageFlag: 'NO_MATCH',
                SelectorAttribute: '00180015',
                SelectorValueNumber: '1',
                SelectorAttributeVR: 'CS',
                SelectorCSValue: 'BREAST'
            }],
            timeBasedImageSetsSequence: [{
                ImageSetNumber: 1,
                ImageSetSelectorCategory: 'RELATIVE_TIME',
                RelativeTime: '0\0',
                RelativeTimeUnits: 'MINUTES',
                ImageSetLabel: 'Current MG Breast'
            },
                {
                    ImageSetNumber: 2,
                    ImageSetSelectorCategory: 'ABSTRACT_PRIOR',
                    AbstractPriorValue: '1\\1',
                    ImageSetLabel: 'Prior MG Breast'
                }]
        }],
        // Skip Number of Screens for now,
        // Skip Nominal Screen Definition Sequence for now,

        // http://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_C.23.3.html
        DisplaySetsSequence: [
            {
                // Left side image (R MLO Current)
                ImageSetNumber: 1,
                DisplaySetNumber: 1,
                DisplaySetPresentationGroup: 1,
                DisplaySetPresentationGroupDescription: 'Current Mediolateral only',
                ImageBoxesSequence: [{
                    DisplayEnvironmentSpatialPosition: '0\0.2\0.16667\0',
                    ImageBoxNumber: 1,
                    ImageBoxLayoutType: 'STACK'
                }],
                FilterOperationsSequence: [{
                    SelectorAttributeVR: 'CS',
                    SelectorCSValue: 'R CC',
                    FilterByCategory: 'SERIES_DESCRIPTION',
                    FilterByOperator: 'MEMBER_OF'
                }]
            }, {
                // Right side image (L MLO Current)
                ImageSetNumber: 1,
                DisplaySetNumber: 1,
                DisplaySetPresentationGroup: 1,
                ImageBoxesSequence: [{
                    ImageBoxNumber: 1,
                    ImageBoxLayoutType: 'STACK'
                }],
                FilterOperationsSequence: [{
                    SelectorAttributeVR: 'CS',
                    SelectorCSValue: 'L CC',
                    FilterByCategory: 'SERIES_DESCRIPTION',
                    FilterByOperator: 'MEMBER_OF'
                }]
            },
            {
                // Left side image (R MLO Current)
                ImageSetNumber: 1,
                DisplaySetNumber: 1,
                DisplaySetPresentationGroup: 2,
                DisplaySetPresentationGroupDescription: 'Current Mediolateral only',
                ImageBoxesSequence: [{
                    DisplayEnvironmentSpatialPosition: '0\0.2\0.16667\0',
                    ImageBoxNumber: 1,
                    ImageBoxLayoutType: 'STACK'
                }],
                FilterOperationsSequence: [{
                    SelectorAttributeVR: 'CS',
                    SelectorCSValue: 'R MLO',
                    FilterByCategory: 'SERIES_DESCRIPTION',
                    FilterByOperator: 'MEMBER_OF'
                }],
                ReformattingOperationType: '',
                ReformattingThickness: '',
                ReformattingInterval: '',
                ReformattingOperationInitialViewDirection: '',
                SortingOperationsSequence: [],
                DisplaySetPatientOrientation: '',
                VOIType: ''
            }, {
                // Right side image (L MLO Current)
                ImageSetNumber: 1,
                DisplaySetNumber: 1,
                DisplaySetPresentationGroup: 2,
                ImageBoxesSequence: [{
                    ImageBoxNumber: 1,
                    ImageBoxLayoutType: 'STACK'
                }],
                FilterOperationsSequence: [{
                    SelectorAttributeVR: 'CS',
                    SelectorCSValue: 'L MLO',
                    FilterByCategory: 'SERIES_DESCRIPTION',
                    FilterByOperator: 'MEMBER_OF'
                }]
            }, {
                // Testing purposes
                // Left side image (R MLO Current)
                ImageSetNumber: 1,
                DisplaySetNumber: 1,
                DisplaySetPresentationGroup: 3,
                DisplaySetPresentationGroupDescription: 'Current Mediolateral only',
                ImageBoxesSequence: [{
                    DisplayEnvironmentSpatialPosition: '0\0.2\0.16667\0',
                    ImageBoxNumber: 1,
                    ImageBoxLayoutType: 'STACK'
                }],
                FilterOperationsSequence: [{
                    SelectorAttributeVR: 'CS',
                    SelectorCSValue: 'R MLO',
                    FilterByCategory: 'SERIES_DESCRIPTION',
                    FilterByOperator: 'MEMBER_OF'
                }]
            }, {
                // Right side image (R CC Current)
                ImageSetNumber: 1,
                DisplaySetNumber: 1,
                DisplaySetPresentationGroup: 3,
                ImageBoxesSequence: [{
                    ImageBoxNumber: 1,
                    ImageBoxLayoutType: 'STACK'
                }],
                FilterOperationsSequence: [{
                    SelectorAttributeVR: 'CS',
                    SelectorCSValue: 'R CC',
                    FilterByCategory: 'SERIES_DESCRIPTION',
                    FilterByOperator: 'MEMBER_OF'
                }]
            }],
        PartialDataDisplayHandling: 'MAINTAIN_LAYOUT',
        SynchronizedScrollingSequence: [],
        NavigationIndicatorSequence: []
    };

    return protocol;
}

function findSetsByPresentationGroup(DisplaySetsSequence, DisplaySetPresentationGroup) {
    var presentationGroupSets = [];
    DisplaySetsSequence.forEach(function(displaySet) {
        if (displaySet.DisplaySetPresentationGroup === DisplaySetPresentationGroup) {
            presentationGroupSets.push(displaySet);
        }
    });
    return presentationGroupSets;
}

function findStudy(displaySet, studies) {
    // Placeholder for now
    return studies.find().fetch()[0].studyInstanceUid;
}

/**
 * Uses the FilterOperationsSequence information to find
 * the relevant series for display in this display set
 *
 * @param displaySet
 * @param study
 * @returns {String} The instance Uid of the series to be displayed
 */
function findSeries(displaySet, study) {
    var categoryDictionary = {
        SERIES_DESCRIPTION: 'seriesDescription'
    };

    // TODO=Put these inside a loop? We need to support multiple filter operations,
    // not just one
    var filterBy = displaySet.FilterOperationsSequence[0].FilterByCategory;
    var selectorValue = displaySet.FilterOperationsSequence[0].SelectorCSValue;
    var filterType = displaySet.FilterOperationsSequence[0].FilterByOperator;
    var category = categoryDictionary[filterBy];

    var seriesInstanceUid;
    study.seriesList.forEach(function(series) {
        // TODO = Add other FilterBy operators
        if (filterType === 'MEMBER_OF') {
            if (series[category] === selectorValue) {
                seriesInstanceUid = series.seriesInstanceUid;
                return false;
            }
        }
    });

    return seriesInstanceUid;
}

/**
 * (Work in progress) Uses the information from a DICOM Hanging Protocol
 * to identify and display studies and series in the image viewer
 *
 * @param hangingProtocol
 * @param inputData
 * @returns {Array} Array of viewport data to be displayed
 */
function applyDICOMHangingProtocol(hangingProtocol, inputData) {
    log.info('applyDICOMHangingProtocol');
    var presentationGroup = inputData.DisplaySetPresentationGroup || 1;
    var studies = ViewerStudies;
    var currentDisplaySets = findSetsByPresentationGroup(hangingProtocol.DisplaySetsSequence, presentationGroup);

    var viewportData = {
        viewports: []
    };

    currentDisplaySets.forEach(function(displaySet, index) {
        // TODO= Find study information by image set properties and
        // image set number of this display set
        var ImageSetNumber = displaySet.ImageSetNumber;

        studyInstanceUid = findStudy(displaySet, studies);

        var study = ViewerStudies.findOne({studyInstanceUid: studyInstanceUid});
        seriesInstanceUid = findSeries(displaySet, study);

        viewportData.viewports[index] = {
            seriesInstanceUid: seriesInstanceUid,
            studyInstanceUid: studyInstanceUid,
            currentImageIdIndex: 0
        };
    });

    return viewportData;
}