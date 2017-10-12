import { OHIF } from 'meteor/ohif:core';

var Future = Npm.require('fibers/future');

DIMSE = {
    connection: new Connection({
        vr: {
            split: false
        }
    })
};

var conn = DIMSE.connection;

var getInstanceRetrievalParams = function(studyInstanceUID, seriesInstanceUID) {
    return {
        0x0020000D: studyInstanceUID ? studyInstanceUID : '',
        0x0020000E: (studyInstanceUID && seriesInstanceUID) ? seriesInstanceUID : '',
        0x00080005: '', // specificCharacterSet
        0x00080020: '', // studyDate
        0x00080030: '', // studyDescription
        0x00080090: '', // referringPhysicianName
        0x00100010: '', // patientName
        0x00100020: '', // patientId
        0x00100030: '', // patientBirthDate
        0x00100040: '', // patientSex
        0x00200010: '', // studyId
        0x0008103E: '', // seriesDescription
        0x00200011: '', // seriesNumber
        0x00080080: '', // institutionName
        0x00080016: '', // sopClassUid
        0x00080018: '', // sopInstanceUid
        0x00080060: '', // modality
        0x00200013: '', // instanceNumber
        0x00280010: '', // rows
        0x00280011: '', // columns
        0x00280100: '', // bitsAllocated
        0x00280101: '', // bitsStored
        0x00280102: '', // highBit
        0x00280103: '', // pixelRepresentation
        0x00280004: '', // photometricInterpretation
        0x0008002A: '', // acquisitionDatetime
        0x00280008: '', // numFrames
        //0x00280009: '', // frameIncrementPointer // This appears to be breaking Orthanc DIMSE connections
        0x00181063: '', // frameTime
        0x00181065: '', // frameTimeVector
        0x00281052: '', // rescaleIntercept
        0x00281053: '', // rescaleSlope
        0x00280002: '', // samplesPerPixel
        0x00180050: '', // sliceThickness
        0x00201041: '', // sliceLocation
        //0x00189327: '', // tablePosition // This appears to be breaking Orthanc DIMSE connections
        0x00281050: '', // windowCenter
        0x00281051: '', // windowWidth
        0x00280030: '', // pixelSpacing
        0x00200062: '', // laterality
        0x00185101: '', // viewPosition
        0x00080008: '', // imageType
        0x00200032: '', // imagePositionPatient
        0x00200037: '', // imageOrientationPatient
        0x00200052: '', // frameOfReferenceUID
        0x00282110: '', // lossyImageCompression
        0x00282112: '', // lossyImageCompressionRatio
        0x00282114: '', // lossyImageCompressionMethod,
        0x00180088: ''  // spacingBetweenSlices

        // Orthanc has a bug here so we can't retrieve sequences at the moment
        // https://groups.google.com/forum/#!topic/orthanc-users/ghKJfvtnK8Y
        //0x00282111: '', // derivationDescription
        //0x00082112: ''  // sourceImageSequence
    };
};

DIMSE.associate = function(contexts, callback, options) {
    var defaults = {
        contexts: contexts
    };
    options = Object.assign(defaults, options);

    OHIF.log.info('Associating...');

    const socket = conn.associate(options, function(pdu) {
        // associated
        OHIF.log.info('==Associated');
        callback.call(this, null, pdu);
    });

    socket.on('error', function (error) {
        callback(error, null);
    });

    socket.on('timeout', function (error) {
        callback(error, null);
    });
};

DIMSE.retrievePatients = function(params, options) {
    //var start = new Date();
    var future = new Future;
    DIMSE.associate([C.SOP_PATIENT_ROOT_FIND], function(error, pdu) {
        if (error) {
            OHIF.log.error('Could not retrieve patients');
            OHIF.log.trace();

            return future.return([]);
        }

        var defaultParams = {
            0x00100010: '',
            0x00100020: '',
            0x00100030: '',
            0x00100040: '',
            0x00101010: '',
            0x00101040: ''
        };

        var result = this.findPatients(Object.assign(defaultParams, params)),
            o = this;

        var patients = [];
        result.on('result', function(msg) {
            patients.push(msg);
        });

        result.on('end', function() {
            o.release();
        });

        this.on('close', function() {
            //var time = new Date() - start;console.log(time + 'ms taken');
            future.return(patients);
        });
    }, options);
    return future.wait();
};

DIMSE.retrieveStudies = function(params, options) {
    //var start = new Date();
    var future = new Future;
    DIMSE.associate([C.SOP_STUDY_ROOT_FIND], function(error, pdu) {
        if (error) {
            OHIF.log.error('Could not retrieve studies');
            OHIF.log.trace();

            return future.throw(error);
        }

        var defaultParams = {
            0x0020000D: '',
            0x00080060: '',
            0x00080005: '',
            0x00080020: '',
            0x00080030: '',
            0x00080090: '',
            0x00100010: '',
            0x00100020: '',
            0x00200010: '',
            0x00100030: ''
        };

        var result = this.findStudies(Object.assign(defaultParams, params)),
            o = this;

        var studies = [];
        result.on('result', function(msg) {
            studies.push(msg);
        });

        result.on('end', function() {
            o.release();
        });

        this.on('close', function() {
            //var time = new Date() - start;console.log(time + 'ms taken');
            future.return(studies);
        });
    }, options);
    return future.wait();
};

DIMSE._retrieveInstancesBySeries = function(conn, series, studyInstanceUID, callback, params) {
    var aSeries = series.shift(),
 seriesInstanceUID = aSeries.getValue(0x0020000E),
        defaultParams = getInstanceRetrievalParams(studyInstanceUID, seriesInstanceUID);

    var result = conn.findInstances(Object.assign(defaultParams, params)),
        instances = [];

    result.on('result', function(msg) {
        instances.push(msg);
    });
    result.on('end', function() {
        if (series.length > 0) {
            callback(instances, false);
            DIMSE._retrieveInstancesBySeries(conn, series, studyInstanceUID, callback, params);
        } else {
            callback(instances, true);
        }
    });
};

DIMSE.retrieveInstancesByStudyOnlyMulti = function(studyInstanceUID, params, options) {
    if (!studyInstanceUID) {
        return [];
    }

    var series = DIMSE.retrieveSeries(studyInstanceUID, params, options),
 instances = [];
    series.forEach(function(seriesData) {
        var seriesInstanceUID = seriesData.getValue(0x0020000E);

        var relatedInstances = DIMSE.retrieveInstances(studyInstanceUID, seriesInstanceUID, params, options);
        instances = instances.concat(relatedInstances);
    });
    return instances;
};

DIMSE.retrieveInstancesByStudyOnly = function(studyInstanceUID, params, options) {
    if (!studyInstanceUID) {
        return [];
    }

    var future = new Future;
    DIMSE.associate([C.SOP_STUDY_ROOT_FIND], function(error, pdu) {
        if (error) {
            OHIF.log.error('Could not retrieve Instances By Study');
            OHIF.log.trace();

            return future.throw(error);
        }

        var defaultParams = {
            0x0020000D: studyInstanceUID,
            0x00080005: '',
            0x00080020: '',
            0x00080030: '',
            0x00080090: '',
            0x00100010: '',
            0x00100020: '',
            0x00200010: '',
            0x0008103E: '',
            0x0020000E: '',
            0x00200011: ''
        };
        var result = this.findSeries(Object.assign(defaultParams, params));
        var series = [];
        var conn = this;
        var allInstances = [];

        result.on('result', function(msg) {
            series.push(msg);
        });
        result.on('end', function() {
            if (series.length > 0) {
                DIMSE._retrieveInstancesBySeries(conn, series, studyInstanceUID, function(relatedInstances, isEnd) {
                    allInstances = allInstances.concat(relatedInstances);
                    if (isEnd) {
                        conn.release();
                    }
                });
            } else {
                conn.release();
            }
        });
        conn.on('close', function() {
            future.return(allInstances);
        });
    });
    return future.wait();
};

DIMSE.retrieveSeries = function(studyInstanceUID, params, options) {
    var future = new Future;
    DIMSE.associate([C.SOP_STUDY_ROOT_FIND], function(error, pdu) {
        if (error) {
            OHIF.log.error('Could not retrieve series');
            OHIF.log.trace();

            return future.return([]);
        }

        var defaultParams = {
            0x0020000D: studyInstanceUID ? studyInstanceUID : '',
            0x00080005: '',
            0x00080020: '',
            0x00080030: '',
            0x00080090: '',
            0x00100010: '',
            0x00100020: '',
            0x00200010: '',
            0x0008103E: '',
            0x0020000E: '',
            0x00200011: ''
        };

        var result = this.findSeries(Object.assign(defaultParams, params)),
            o = this;

        var series = [];
        result.on('result', function(msg) {
            series.push(msg);
        });

        result.on('end', function() {
            o.release();
        });

        this.on('close', function() {
            future.return(series);
        });
    }, options);
    return future.wait();
};

DIMSE.retrieveInstances = function(studyInstanceUID, seriesInstanceUID, params, options) {
    var future = new Future;
    DIMSE.associate([C.SOP_STUDY_ROOT_FIND], function(error, pdu) {
        if (error) {
            OHIF.log.error('Could not retrieve instances');
            OHIF.log.trace();

            return future.throw(error);
        }

        var defaultParams = getInstanceRetrievalParams(studyInstanceUID, seriesInstanceUID);
        var result = this.findInstances(Object.assign(defaultParams, params)),
            o = this;

        var instances = [];
        result.on('result', function(msg) {
            instances.push(msg);
        });

        result.on('end', function() {
            o.release();
        });

        this.on('close', function() {
            future.return(instances);
        });
    }, options);
    return future.wait();
};

DIMSE.storeInstances = function(fileList, callback) {
    var handle = conn.storeInstances(fileList);
    handle.on('file', function(err, file) {
        callback(err, file);
    });
};

DIMSE.moveInstances = function(studyInstanceUID, seriesInstanceUID, sopInstanceUID, sopClassUID, params) {
    DIMSE.associate([C.SOP_STUDY_ROOT_MOVE, sopClassUID], function(error) {
        if (error) {
            OHIF.log.error('Could not move instances');
            OHIF.log.trace();

            return;
        }

        var defaultParams = {
            0x0020000D: studyInstanceUID ? studyInstanceUID : '',
            0x0020000E: seriesInstanceUID ? seriesInstanceUID : '',
            0x00080018: sopInstanceUID ? sopInstanceUID : ''
        };
        this.moveInstances('OHIFDCM', Object.assign(defaultParams, params));
    });
};
