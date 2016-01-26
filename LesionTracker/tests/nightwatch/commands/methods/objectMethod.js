// async version calls method on the server
exports.command = function(methodName, timeout) {
  /*var client = this;
  if (!timeout) {
      timeout = 5000;
  }

  this
    .timeoutsAsyncScript(timeout)
    .executeAsync(function(data, meteorCallback){
      //return HipaaLogger.logEventObject(data);
      Meteor.call(methodName, data, function(meteorError, meteorResult){
        var response = (meteorError ? { error: meteorError } : { result: meteorResult });
        meteorCallback(response);
      })
    }, [hipaaEvent], function(result){
      console.log("result.value", result.value);
      client.assert.ok(result.value);
    }).pause(1000)
    return this;*/
    return this;
};
