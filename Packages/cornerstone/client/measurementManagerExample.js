// Example usage for something like RECIST
var tumourLengthMeasurementManager = cornerstoneTools.MeasurementManager;
function singleValidator(measurement) {
    var result = {
        isValid: true
    };
    if (measurement.distance < 10) {
        result.isValid = false;
        result.details = 'Measurement distance must be less than 10 mm';
    }
    return result;
}

function setValidator(measurements) {
    var result = {
        isValid: true
    };
    if (measurements.length > 2) {
        result.isValid = false;
        result.details = 'The number of measurements per image must be less than 2';
    }
    return result;
}

// Or a remote call
function remoteSetValidator(measurements) {
    var deferred = $.Deferred;

    var result = {
        isValid: true,
        promise: deferred.promise()
    };
    
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                var response = JSON.parse(xhr.response);
                if (response.isValid) {
                    deferred.resolve(xhr.responseText);
                } else {
                    deferred.reject(xhr.responseText);
                }
            } else {
                // The request didn't succeed
                deferred.reject(xhr.responseText);
            }
        }
    };
    xhr.open("POST", "/urlToValidateRECIST", true);
    xhr.send(measurements);

    return result;
}

tumourLengthMeasurementManager.setSingleMeasurementValidator(singleValidator);
tumourLengthMeasurementManager.setMeasurementSetValidator(setValidator);
