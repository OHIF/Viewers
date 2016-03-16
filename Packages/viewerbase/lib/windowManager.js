/**
 * This is a temporary function which will return a hardcoded hanging protocol as a JavaScript object
 */
function getMammoHangingProtocolObject() {

    var protocol = [{
            stage: 1,
            rows: 2,
            columns: 4,
            viewports: [{
                    seriesDescription: 'RCC',
                    study: 'prior'
                }, {
                    seriesDescription: 'LCC',
                    study: 'prior'
                }, {
                    seriesDescription: 'RMLO',
                    study: 'prior'
                }, {
                    seriesDescription: 'LMLO',
                    study: 'prior'
                }, {
                    seriesDescription: 'RCC',
                    study: 'current'
                }, {
                    seriesDescription: 'LCC',
                    study: 'current'
                }, {
                    seriesDescription: 'RMLO',
                    study: 'current'
                }, {
                    seriesDescription: 'LMLO',
                    study: 'current'
                }
            ]
        }, {
            stage: 2,
            rows: 1,
            columns: 2,
            viewports: [{
                    seriesDescription: 'RCC',
                    study: 'current'
                }, {
                    seriesDescription: 'LCC',
                    study: 'current'
                }
            ]
        }, {
            stage: 3,
            rows: 1,
            columns: 2,
            viewports: [{
                    seriesDescription: 'RMLO',
                    study: 'current'
                }, {
                    seriesDescription: 'LMLO',
                    study: 'current'
                }
            ]
        }, {
            stage: 4,
            rows: 1,
            columns: 2,
            viewports: [{
                    seriesDescription: 'RCC',
                    study: 'current'
                }, {
                    seriesDescription: 'RCC',
                    study: 'prior'
                }
            ]
        }, {
            stage: 5,
            rows: 1,
            columns: 2,
            viewports: [{
                    seriesDescription: 'LCC',
                    study: 'current'
                }, {
                    seriesDescription: 'LCC',
                    study: 'prior'
                }
            ]
        }, {
            stage: 6,
            rows: 1,
            columns: 2,
            viewports: [{
                    seriesDescription: 'LMLO',
                    study: 'current'
                }, {
                    seriesDescription: 'LMLO',
                    study: 'prior'
                }
            ]
        }, {
            stage: 7,
            rows: 1,
            columns: 2,
            viewports: [{
                    seriesDescription: 'RMLO',
                    study: 'current'
                }, {
                    seriesDescription: 'RMLO',
                    study: 'prior'
                }
            ]
        }, {
            stage: 8,
            rows: 2,
            columns: 4,
            viewports: [{
                    seriesDescription: 'RCC',
                    study: 'prior',
                    options: {
                        includeCADMarkers: true
                    }
                }, {
                    seriesDescription: 'LCC',
                    study: 'prior',
                    options: {
                        includeCADMarkers: true
                    }
                }, {
                    seriesDescription: 'RMLO',
                    study: 'prior',
                    options: {
                        includeCADMarkers: true
                    }
                }, {
                    seriesDescription: 'LMLO',
                    study: 'prior',
                    options: {
                        includeCADMarkers: true
                    }
                }, {
                    seriesDescription: 'RCC',
                    study: 'current',
                    options: {
                        includeCADMarkers: true
                    }
                }, {
                    seriesDescription: 'LCC',
                    study: 'current',
                    options: {
                        includeCADMarkers: true
                    }
                }, {
                    seriesDescription: 'RMLO',
                    study: 'current',
                    options: {
                        includeCADMarkers: true
                    }
                }, {
                    seriesDescription: 'LMLO',
                    study: 'current',
                    options: {
                        includeCADMarkers: true
                    }
                }
            ]
        }
    ];

    return protocol;
}

function findSeriesByDescription(seriesDescription, study) {
    var seriesInstanceUid;
    study.seriesList.forEach(function(series) {
        if (!series.seriesDescription) {
            return;
        }

        var currentSeriesDescription = series.seriesDescription.replace(' ', '');
        if (currentSeriesDescription === seriesDescription) {
            seriesInstanceUid = series.seriesInstanceUid;
            return false;
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
function applyHangingProtocol(hangingProtocol, inputData) {
    var presentationGroup = inputData.DisplaySetPresentationGroup || 1;
    var studies = ViewerStudies;
    var currentProtocolData = hangingProtocol[presentationGroup - 1];

    var viewportData = {
        viewports: [],
        viewportRows: currentProtocolData.rows,
        viewportColumns: currentProtocolData.columns
    };

    var currentStudy = ViewerStudies.find({}, {$sort: {studyDate: 1}}).fetch()[0];
    var otherStudies = WorklistStudies.find({
        patientId: currentStudy.patientId,
        studyInstanceUid: {
            $ne: currentStudy.studyInstanceUid
        }
    }, {$sort: {
        studyDate: 1
    }}).fetch();
    var priorStudy = otherStudies[0];

    currentProtocolData.viewports.forEach(function(viewport, index) {
        if (viewport.study === 'current') {
            study = currentStudy;
        } else if (viewport.study === 'prior') {
            study = currentStudy;
            /*ViewerStudies.find({
                studyInstanceUid: {
                    $ne: currentStudy.studyInstanceUid
                }
            }, {$sort: {studyDate: 1}}).fetch()[0];*/
        }
        
        seriesInstanceUid = findSeriesByDescription(viewport.seriesDescription, study);

        viewportData.viewports[index] = {
            seriesInstanceUid: seriesInstanceUid,
            studyInstanceUid: study.studyInstanceUid,
            currentImageIdIndex: 0,
            options: viewport.options
        };
    });

    return viewportData;
}


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

/**
 * This is an example of a hanging protocol
 * It takes in a set of studies, as well as the
 * number of rows and columns in the layout.
 *
 * It returns an array of objects, one for each viewport, detailing
 * which series should be loaded in the viewport.
 *
 * @param inputData
 * @returns {Array}
 */
function defaultHangingProtocol(inputData) {
    var studies = ViewerStudies.find().fetch();
    var viewportRows = inputData.viewportRows;
    var viewportColumns = inputData.viewportColumns;

    // This is the most basic hanging protocol.
    var stacks = [];
    studies.forEach(function(study) {
        study.seriesList.forEach(function(series) {
            
            // Ensure that the series has image data
            // (All images have rows)
            var anInstance = series.instances[0];
            if (!anInstance || !anInstance.rows) {
                return;
            }

            var stack = {
                series: series,
                study: study
            };
            stacks.push(stack);
        });
    });

    var viewportData = {
        viewports: []
    };

    var numViewports = viewportRows * viewportColumns;
    for (var i=0; i < numViewports; ++i) {
        if (i >= stacks.length) {
            // We don't have enough stacks to fill the desired number of viewports, so stop here
            break;
        }
        viewportData.viewports[i] = {
            seriesInstanceUid: stacks[i].series.seriesInstanceUid,
            studyInstanceUid: stacks[i].study.studyInstanceUid,
            currentImageIdIndex: 0
        };
    }
    return viewportData;
}

var hangingProtocol;
var presentationGroup = 1;

function getHangingProtocol(inputData) {
    // TODO = Update this to use Collection logic
    var studies = ViewerStudies.find().fetch();

    if (!studies.length) {
        log.warn("No studies provided to Hanging Protocol");
        return;
    }

    // Find the unique modalities in this study
    var modalities = [];
    studies.forEach(function(study) {
        study.seriesList.forEach(function(series) {
            if (modalities.indexOf(series.modality) < 0) {
                modalities.push(series.modality);
            }
        });
    });

    if (modalities.indexOf('MG') > -1) {
        var hp = getMammoHangingProtocolObject();
        Session.set('WindowManagerPresentationGroup', presentationGroup);
        var testData = applyHangingProtocol(hp, inputData);
        return testData;
        // Commenting this out for now so we can hardcode a MG protocol
        /*var hangingProtocol = getMammoHangingProtocol();
        Session.set('WindowManagerPresentationGroup', presentationGroup);
        return applyDICOMHangingProtocol(hangingProtocol, inputData);*/
    }

    Session.set('WindowManagerPresentationGroup', undefined);
    return defaultHangingProtocol(inputData);
}

function setHangingProtocol(protocol) {
    hangingProtocol = protocol;
}

function previousPresentationGroup() {
    presentationGroup--;
    presentationGroup = Math.max(1, presentationGroup);

    log.info('previousPresentationGroup: ' + presentationGroup);
    Session.set('WindowManagerPresentationGroup', presentationGroup);
    Session.set('UseHangingProtocol', Random.id());
}

function nextPresentationGroup() {
    var numPresentationGroups = getNumPresentationGroups();

    presentationGroup++;
    presentationGroup = Math.min(numPresentationGroups, presentationGroup);

    log.info('nextPresentationGroup: ' + presentationGroup);
    Session.set('WindowManagerPresentationGroup', presentationGroup);
    Session.set('UseHangingProtocol', Random.id());
}

function getNumPresentationGroups() {
    // TODO=Pull this information from the largest
    // value of DisplaySetPresentationGroup in the DisplaySetsSequence
    // after the DICOM-HP is parsed
    return 8;
}

function getCurrentPresentationGroup() {
    return presentationGroup;
}

function setCurrentPresentationGroup(groupNumber) {
    // Unused for now
    presentationGroup = groupNumber;
}

WindowManager = {
    setHangingProtocol: setHangingProtocol,
    getHangingProtocol: getHangingProtocol,
    getNumPresentationGroups: getNumPresentationGroups,
    setCurrentPresentationGroup: setCurrentPresentationGroup,
    getCurrentPresentationGroup: getCurrentPresentationGroup,
    nextPresentationGroup: nextPresentationGroup,
    previousPresentationGroup: previousPresentationGroup
};

WindowManager.setHangingProtocol(defaultHangingProtocol);
