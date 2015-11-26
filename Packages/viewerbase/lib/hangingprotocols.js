/**
 * This is a temporary function which will return a hardcoded hanging protocol as a JavaScript object
 */
getMammoHangingProtocolObject = function() {
    var protocol = {
        // Need to expand this to allow real searches for studies
        studiesNeeded: [
            'current',
            'prior'
        ],
        primaryModality: 'MG',
        stages: [{
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
        }]
    };

    return protocol;
};
