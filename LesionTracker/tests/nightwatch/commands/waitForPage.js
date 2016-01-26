exports.command = function(pageId) {

  this
    .waitForElementVisible(pageId, 3000)

  return this; // allows the command to be chained.
};
