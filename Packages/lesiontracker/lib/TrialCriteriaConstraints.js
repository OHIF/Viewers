// Define the Trial Criteria Structure
TrialCriteriaConstraints = {
    RECIST: RECIST,
    irRC: irRC
};

/**
 * RECIST 1.1 Trial Criteria Definition
 *
 * Baseline Checks:
 * - Extranodal lesions must be >/= 10 mm long axis AND >/= double the acquisition slice thickness by CT and MR
 * - Extranodal lesions must be >/= 20 mm on chest x-ray (although x-rays rarely used for clinical trial assessment)
 * - Nodal lesions must be >/= 15 mm short axis AND >/= double the acquisition slice thickness by CT and MR
 * - Up to a max of 2 target lesions per organ
 * - Up to a max of 5 target lesions total
 * - Non-targets can only be assessed as 'present'
 * - Target lesions must have measurements (cannot be assessed as CR, UN/NE, EX)
 * - Time Point Measurement Total = Sum of long axis measurements for extranodal target lesion + short axis measurements for nodal lesions
 */
function RECIST(image) {
    var acquisitionSliceThickness;

    var isChestXray;
    if (image) {
        acquisitionSliceThickness = image.acquisitionSliceThickness;

        // TODO: Use metaData to determine if this is a chest X-ray
        isChestXray = false;
    }

    // Define the RECIST 1.1 structure
    var criteria = {
        baseline: {
            target: {},
            nonTarget: {},
            group: {}
        }
    };

    if (acquisitionSliceThickness) {
        criteria.baseline.target.nodal = {
            shortestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: Math.max(15, 2 * acquisitionSliceThickness),
                    message: '^Nodal lesions must be >= 15 mm short axis AND >= double the acquisition slice thickness (' +
                             acquisitionSliceThickness + ' mm) for CT and MR.'
                }
            }
        };
    } else {
        criteria.baseline.target.nodal = {
            shortestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: 15,
                    //message: '^Nodal target lesions must be >= %{count} mm short axis'
                }
            }
        };
    }

    criteria.baseline.target.all = {
        // - Target lesions must have measurements (cannot be assessed as CR, UN/NE, EX)
        response: {
            exclusion: {
                within: {
                    CR: 'Complete Response (CR)',
                    UN: 'Unknown (UN)',
                    NE: 'Non-evaluable (NE)',
                    EX: 'Excluded (EX)'
                },
                message: '^Target lesions must have a length and cannot be marked as %{value} at baseline.'
            }
        },
        totalLesionBurden: {
            numericality: {
                greaterThanOrEqualTo: 2, // TODO: Check this, the value wasn't specified!
                //message: '^Total lesion burden (SPD target lesions + SPD new lesions) should be greater than %{count}.'
            }
        }
    };

    criteria.baseline.nonTarget.all = {
        // - Non-targets can only be assessed as 'present'
        response: {
            // This is a workaround since Validating equality to something is not implemented yet
            // https://github.com/ansman/validate.js/issues/79
            presence: {
                message: "^Non-target lesions can only be assessed as 'Present' at Baseline"
            },
            inclusion: {
                within: ['Present'],
                message: "^Non-target lesions can only be assessed as 'Present' at Baseline"
            }
        }
    };

    criteria.baseline.perOrgan = {
        numberOfLesionsPerOrgan: {
            numericality: {
                lessThanOrEqualTo: 2,
                //message: '^A maximum of %{count} target lesions per organ are allowed at Baseline.'
            }
        }
    };

    criteria.baseline.group = {
        totalNumberOfLesions: {
            numericality: {
                lessThanOrEqualTo: 5,
                //message: '^A maximum of %{count} target lesions total are allowed at Baseline.'
            }
        }
    };

    if (acquisitionSliceThickness) {
        criteria.baseline.target.extraNodal = {
            longestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: Math.max(10, 2 * acquisitionSliceThickness),
                    message: '^Extranodal lesions must be >= 10 mm long axis AND >= double the acquisition slice thickness (' +
                    acquisitionSliceThickness + ' mm) for CT and MR.'
                }
            }
        };
    } else if (isChestXray) {
        criteria.baseline.target.extraNodal = {
            // -
            longestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: 20,
                    //message: '^Extranodal lesions must be >= %{count} mm on chest X-ray'
                }
            }
        };
    } else {
        criteria.baseline.target.extraNodal = {
            longestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: 10,
                    //message: '^Extranodal target lesions must be >= %{count} mm long axis'
                }
            }
        };
    }

    return criteria;
}

/**
 * irRC Trial Criteria Definition
 * 
 * Baseline Checks:
 * - Target lesions must be >/= 10 X 10 mm
 * - Up to a max of 5 target lesions per organ
 * - Up to a max of 10 target lesions total
 * - Non-targets can only be assessed as 'present'
 * - Target lesions must have measurements (cannot be assessed as CR, UN/NE, EX)
 */
function irRC(image) {
    var acquisitionSliceThickness;
    if (image) {
        acquisitionSliceThickness = image.acquisitionSliceThickness;
    }

    // Define the irRC structure
    var criteria = {
        baseline: {
            target: {},
            nonTarget: {}
        },
        followup: {
            newLesions: {
                target: {}
            },
            target: {}
        },
        all: {}
    };

    if (acquisitionSliceThickness) {
        criteria.baseline.target.all = {
            longestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: Math.max(10, acquisitionSliceThickness),
                    message: '^Target lesions must be >= 10 mm long axis AND >= double the acquisition slice thickness (' +
                    acquisitionSliceThickness + ' mm) for CT and MR.'
                }
            },
            shortestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: Math.max(10, acquisitionSliceThickness),
                    message: '^Target lesions must be >= 10 mm short axis AND >= double the acquisition slice thickness (' +
                    acquisitionSliceThickness + ' mm) for CT and MR.'
                }
            }
        };
    } else {
        criteria.baseline.target.all = {
            longestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: 10,
                    //message: '^Target lesions must be >= %{count} mm long axis.'
                }
            },
            shortestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: 10,
                    //message: '^Target lesions must be >= %{count} mm short axis.'
                }
            }
        };
    }

    criteria.baseline.target.all.response = {
        exclusion: {
            within: {
                CR: 'Complete Response (CR)',
                UN: 'Unknown (UN)',
                NE: 'Non-evaluable (NE)',
                EX: 'Excluded (EX)'
            },
            message: '^^Target lesions must have a length and cannot be marked as %{value} at baseline.'
        }
    };

    criteria.baseline.nonTarget.all = {
        response: {
            // This is a workaround since Validating equality to something is not implemented yet
            // https://github.com/ansman/validate.js/issues/79
            presence: {
                message: "^Non-target lesions can only be assessed as 'Present' at Baseline"
            },
            inclusion: {
                within: ['Present'],
                message: "^Non-target lesions can only be assessed as 'Present' at Baseline"
            }
        }
    };

    criteria.baseline.perOrgan = {
        numberOfLesionsPerOrgan: {
            numericality: {
                lessThanOrEqualTo: 5,
                //message: '^A maximum of %{count} target lesions per organ are allowed at Baseline.'
            }
        }
    };

    criteria.baseline.group = {
        totalNumberOfLesions: {
            numericality: {
                lessThanOrEqualTo: 10,
                //message: '^A maximum of %{count} target lesions total are allowed at Baseline.'
            }
        }
    };

    if (acquisitionSliceThickness) {
        criteria.followup.newLesions.target.all = {
            // - New target lesions must be >/= 5 X 5 mm AND >/= double the acquisition slice thickness by CT and MR
            longestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: Math.max(5, 2 * acquisitionSliceThickness),
                    message: '^New target lesions must be >= 5 mm long axis AND >= double the acquisition slice thickness (' +
                    acquisitionSliceThickness + ' mm) for CT and MR.'
                }
            },
            shortestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: Math.max(5, 2 * acquisitionSliceThickness),
                    message: '^New target lesions must be >= 5 mm short axis AND >= double the acquisition slice thickness (' +
                    acquisitionSliceThickness + ' mm) for CT and MR.'
                }
            }
        };
    } else {
        criteria.followup.newLesions.target.all = {
            // - New target lesions must be >/= 5 X 5 mm
            longestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: 5,
                    //message: '^New target lesions must be >= %{count} mm long axis.'
                }
            },
            shortestDiameter: {
                numericality: {
                    greaterThanOrEqualTo: 5,
                    //message: '^New target lesions must be >= %{count} mm short axis.'
                }
            }
        };
    }

    criteria.followup.group = {
        numberOfLesionsPerOrgan: {
            numericality: {
                lessThanOrEqualTo: 5,
                //message: '^A maximum of %{count} target lesions per organ are allowed at Followup.'
            }
        },
        totalNumberOfLesions: {
            numericality: {
                lessThanOrEqualTo: 10,
                //message: '^A maximum of %{count} target lesions total are allowed at Followup.'
            }
        }
    };

    // TODO: Check the actual requirement for total burden!
    criteria.all.group = {
        totalLesionBurden: {
            numericality: {
                greaterThanOrEqualTo: 100,
                //message: '^Total lesion burden (SPD target lesions + SPD new lesions) should be greater than %{count}.'
            }
        }
    };

    return criteria;
}

/**
 * Retrieve trial criteria constraints based on the image that measurements appear upon
 * If no image is specified, it is assumed that group or per Organ level criteria are desired.
 *
 * @param criteriaTypes An array of valid Trial Criteria set names (e.g. ['RECIST', 'irRC'])
 * NOTE: Multiple criteria are not yet supported
 *
 * @param imageId A Cornerstone Image ID
 * @returns {*} An Object of Trial Criteria that can be used to validate measurements' conformance
 */
getTrialCriteriaConstraints = function(criteriaTypes, imageId) {
    // TODO: update this when we allow multiple criteria
    var allCriteria = [];
    criteriaTypes.forEach(function(criteriaType) {
        if (!TrialCriteriaConstraints[criteriaType]) {
            throw 'No such Trial Criteria defined: ' + criteriaType;
        }

        // If no imageId was specified, skip customization of the criteria
        // and return the requested criteria right away
        var criteria;
        if (!imageId) {
            criteria = TrialCriteriaConstraints[criteriaType]();
            allCriteria.push(criteria);
            return;
        }

        // Otherwise, retrieve the series metaData to identify the modality of the image
        var seriesMetaData = cornerstoneTools.metaData.get('series', imageId);
        if (!seriesMetaData) {
            return;
        }

        // TODO: Get the rest of the metaData that has already been loaded by Cornerstone
        var image = {};

        // If we are looking at an MR or CT image, we should pass the slice thickness
        // to the Trial Criteria functions so that they can customize the validation rules
        if (seriesMetaData.modality === 'MR' || seriesMetaData.modality === 'CT') {
            var instanceMetaData = cornerstoneTools.metaData.get('instance', imageId);
            image.acquisitionSliceThickness = instanceMetaData.sliceThickness;
        }

        // Retrieve the study metaData in order to find the timepoint type
        var studyMetaData = cornerstoneTools.metaData.get('study', imageId);
        if (!studyMetaData) {
            return;
        }

        // Retrieve the Study document from the Collection of associated Studies
        var study = Studies.findOne({
            studyInstanceUid: studyMetaData.studyInstanceUid
        });

        if (!study) {
            return;
        }

        // Find the related Timepoint document
        var timepoint = Timepoints.findOne({
            timepointId: study.timepointId
        });

        if (!timepoint) {
            log.warn('Timepoint related to study is missing.');
            return;
        }

        // Retrieve the Timepoint's type (e.g. 'baseline' or 'followup')
        var timepointType = timepoint.timepointType;

        // Obtain the customized trial criteria given the image metaData
        criteria = TrialCriteriaConstraints[criteriaType](image);

        // Return the relevant criteria given the current timepoint type
        allCriteria.push(criteria[timepointType]);
    });

    return allCriteria[0];
};
