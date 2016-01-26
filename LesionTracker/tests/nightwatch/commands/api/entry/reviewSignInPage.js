exports.command = function(username, password) {
  this
    .waitForElementVisible('#entrySignIn', 1000)
      .verify.elementPresent("#signInPageTitle")
      .verify.elementPresent("#signInPageMessage")
      .verify.elementPresent("#signInPageEmailInput")
      .verify.elementPresent("#signInPagePasswordInput")
      .verify.elementPresent("#signInToAppButton")
      .verify.elementPresent("#needAnAccountButton")

      .verify.containsText("#signInPageTitle", "Sign In")
      .verify.containsText("#signInPageMessage", "Improve your clincal practice with checklists.")

  return this; // allows the command to be chained.
};
