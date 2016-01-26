// add tests to this file using the Nightwatch.js API
// http://nightwatchjs.org/api

module.exports = {
  "Layout & Static Pages" : function (client) {
    client
      .url("http://localhost:3000")
      .resizeWindow(1024, 768)
      .verify.elementPresent("body")


      .end();
  }
};
