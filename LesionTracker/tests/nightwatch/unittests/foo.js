//var Utils = require('lib/util/utils.js');
module.exports = {
  testTrue: function(client){
    client.assert.equal(true, true);
  }
  /*testFormatElapsedTime : function(client) {
    var test = client.assert;

    var resultMs = Utils.formatElapsedTime(999);
    var resultSec = Utils.formatElapsedTime(1999);
    var resultMin = Utils.formatElapsedTime(122299, true);

    test.equal(resultMs, '999ms');
    test.equal(resultSec, '1.999s');
    test.equal(resultMin, '2m 2s / 122299ms');
  },

  testMakeFnAsync : function(client) {
    function asynFn(done) {
      done();
    }

    function syncFn() {}

    var test = client.assert;

    test.equal(Utils.makeFnAsync(1, asynFn), asynFn);

    var convertedFn = Utils.makeFnAsync(1, syncFn);
    convertedFn(function() {
      test.ok('converted fn called');
    });
  }*/
};
