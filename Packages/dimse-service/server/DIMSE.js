var net = Npm.require('net'),
    Future = Npm.require('fibers/future');

DIMSE = {};

DIMSE.associate = function(contexts, callback) {
    var host = Meteor.settings.dimse.host,
        port = Meteor.settings.dimse.port,
        ae = Meteor.settings.dimse.hostAE;

    var client = net.connect({
            host: host,
            port: port
        },
        function() { //'connect' listener
            console.log('==Connected');

            var conn = new Connection(client, {
                vr: {
                    split: false
                }
            });
            conn.associate({
                contexts: contexts,
                hostAE: ae
            }, function(pdu) {
                // associated
                console.log('==Associated');
                callback.call(conn, pdu);
            });
        });
};

DIMSE.retrievePatients = function(params) {
    //var start = new Date();
    var future = new Future;
    DIMSE.associate([C.SOP_PATIENT_ROOT_FIND], function(pdu) {
        var defaultParams = {
            0x00100010: "",
            0x00100020: "",
            0x00100030: "",
            0x00100040: "",
            0x00101010: "",
            0x00101040: ""
        };

        this.setFindContext(C.SOP_PATIENT_ROOT_FIND);
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
    });
    return future.wait();
};

DIMSE.retrieveStudies = function(params) {
    //var start = new Date();
    var future = new Future;
    DIMSE.associate([C.SOP_STUDY_ROOT_FIND], function(pdu) {
        var defaultParams = {
            0x0020000D: "",
            0x00080060: "",
            0x00080005: "",
            0x00080020: "",
            0x00080030: "",
            0x00080090: "",
            0x00100010: "",
            0x00100020: "",
            0x00200010: "",
            0x00100030: ""
        };

        this.setFindContext(C.SOP_STUDY_ROOT_FIND);
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
    });
    return future.wait();
};

DIMSE.retrieveSeries = function(studyInstanceUID, params) {
    var future = new Future;
    DIMSE.associate([C.SOP_STUDY_ROOT_FIND], function(pdu) {
        var defaultParams = {
            0x0020000D: studyInstanceUID ? studyInstanceUID : "",
            0x00080005: "",
            0x00080020: "",
            0x00080030: "",
            0x00080090: "",
            0x00100010: "",
            0x00100020: "",
            0x00200010: "",
            0x0008103E: "",
            0x0020000E: "",
            0x00200011: ""
        };

        this.setFindContext(C.SOP_STUDY_ROOT_FIND);
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
    });
    return future.wait();
};

DIMSE.retrieveInstances = function(studyInstanceUID, seriesInstanceUID, params) {
    var future = new Future;
    DIMSE.associate([C.SOP_STUDY_ROOT_FIND], function(pdu) {
        var defaultParams = {
            0x0020000D: studyInstanceUID ? studyInstanceUID : "",
            0x0020000E: (studyInstanceUID && seriesInstanceUID) ? seriesInstanceUID : "",
            0x00080005: "",
            0x00080020: "",
            0x00080030: "",
            0x00080090: "",
            0x00100010: "",
            0x00100020: "",
            0x00200010: "",
            0x0008103E: "",
            0x00200011: "",
            0x00080016: "",
            0x00080018: "",
            0x00200013: "",
            0x00280010: "",
            0x00280011: "",
            0x00280100: "",
            0x00280103: ""
        };

        this.setFindContext(C.SOP_STUDY_ROOT_FIND);
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
    });
    return future.wait();
};