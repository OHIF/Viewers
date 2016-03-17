var Future = Npm.require('fibers/future');

DIMSE = {};

var conn = new Connection({
    vr: {
        split: false
    }
});

Meteor.startup(function(){
    var peers = Meteor.settings.dimse;
    console.log('Adding DIMSE peers');
    if (peers && peers.length) {
        peers.forEach(function(peer){
            conn.addPeer(peer);
        });
    }
});

DIMSE.associate = function(contexts, callback, options) {
    var defaults = {
        contexts: contexts
    };
    options = Object.assign(defaults, options);

    conn.associate(options, function(pdu) {
        // associated
        console.log('==Associated');
        callback.call(this, pdu);
    });
};

DIMSE.retrievePatients = function(params, options) {
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

DIMSE.retrieveSeries = function(studyInstanceUID, params, options) {
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

DIMSE.storeInstances = function(fileList) {
    var handle = conn.storeInstances(fileList);
    handle.on('file', function(err, file) {
        console.log(err, file);
    })
};

DIMSE.moveInstances = function(studyInstanceUID, seriesInstanceUID, sopInstanceUID, sopClassUID, params) {
    DIMSE.associate([C.SOP_STUDY_ROOT_MOVE, sopClassUID], function() {
        var defaultParams = {
            0x0020000D: studyInstanceUID ? studyInstanceUID : "",
            0x0020000E: seriesInstanceUID ? seriesInstanceUID : "",
            0x00080018: sopInstanceUID ? sopInstanceUID : ""
        }
        this.moveInstances("OHIFDCM", Object.assign(defaultParams, params));
    });
}