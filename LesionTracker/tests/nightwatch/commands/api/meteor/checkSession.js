/*exports.command = function(sessionName, expectedValue, timeout, callback) {

    var self = this;
    if (!timeout) {
        timeout = 5000;
    }

    var glassOpacity = false;

    this
      .timeoutsAsyncScript(timeout)
        .executeAsync(function (data, callback) {
            return Session.get('glassOpacity');
        }, [''], function (response) { // you need to pass an ARRAY of ONE argument, must be a bug
            if (response.value.error) {
                throw 'Meteor apply (call) returned an error: ' + response.value.error;
            } else if (typeof callback === 'function') {
              callback.call(self);
            }
        })
    return this;
};*/




// syncrhonous version; only works for checking javascript objects on client
exports.command = function(sessionVarName, expectedValue) {
  var client = this;
  this
    .execute(function(data){
      return Session.get(data);
    }, [sessionVarName], function(result){
      client.assert.ok(result.value);
      if(expectedValue){
        client.assert.equal(result.value, expectedValue);
      }
    }).pause(1000)
    return this;
};
