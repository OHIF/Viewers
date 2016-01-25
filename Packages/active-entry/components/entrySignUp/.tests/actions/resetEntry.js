
// resetEntry.js
exports.command = function () {

  this
    .timeoutsAsyncScript(5000)
    .executeAsync(function (data, meteorCallback) {
      ActiveEntry.reset();
    }, []).pause(1000);
  return this;
};
