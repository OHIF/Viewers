exports.command = function(input, callback) {

  this
    .frame(null)
    .waitForElementVisible("body", 1000, "=============================================================")
    .verify.elementPresent("body", "== " + input)

  return this; // allows the command to be chained.
};
