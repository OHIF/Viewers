



// syncrhonous version; doesn't work well
/*exports.command = function(hipaaEvent, timeout) {
  var client = this;
  this
    .execute(function(data){
      return HipaaLogger.logEventObject(data);
    }, [hipaaEvent], function(result){
      console.log("result.value", result.value);
      client.assert.ok(result.value);
    }).pause(1000)
    return this;
};*/




// async version calls method on the server
exports.command = function(hipaaEvent, timeout) {
  var client = this;
  if (!timeout) {
      timeout = 5000;
  }

  this
    .timeoutsAsyncScript(timeout)
    .executeAsync(function(data, meteorCallback){
      //return HipaaLogger.logEventObject(data);
      Meteor.call('logHipaaEvent', data, function(meteorError, meteorResult){
        var response = (meteorError ? { error: meteorError } : { result: meteorResult });
        meteorCallback(response);
      })
    }, [hipaaEvent], function(result){
      console.log("result.value", result.value);
      client.assert.ok(result.value);
    }).pause(1000)
    return this;
};
