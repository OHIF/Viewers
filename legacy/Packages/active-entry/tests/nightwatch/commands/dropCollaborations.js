// async version calls method on the server
exports.command = function () {
  var client = this;

  this
    .timeoutsAsyncScript(5000)
    .executeAsync(function (data, meteorCallback) {
      //return HipaaLogger.logEventObject(data);
      Meteor.call("dropCollaborations", data, function (meteorError, meteorResult) {
        var response = (meteorError ? {
          error: meteorError
        } : {
          result: meteorResult
        });
        meteorCallback(response);
      });
    }, [], function (result) {
      console.log("result.value", result.value);
      client.assert.ok(result.value);
    }).pause(1000);
  return this;
};
