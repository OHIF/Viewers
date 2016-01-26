exports.command = function(username, password) {

  this
    .waitForElementVisible('#entrySignIn', 1000)
      .verify.elementPresent("#signInPageEmailInput")
      .verify.elementPresent("#signInPagePasswordInput")

      .setValue("#signInPageEmailInput", username)
      .setValue("#signInPagePasswordInput", password)

    .click("#signInToAppButton").pause(1000)

  return this; // allows the command to be chained.
};
