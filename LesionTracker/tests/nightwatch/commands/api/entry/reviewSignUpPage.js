exports.command = function(username, password) {
  this
    .waitForElementVisible('#entrySignUp', 1000)
      .verify.elementPresent("#signUpPageEmailInput")
      .verify.elementPresent("#signUpPagePasswordInput")
      .verify.elementPresent("#signUpPagePasswordConfirmInput")

      .verify.elementPresent("#signUpPageJoinNowButton")

  return this; // allows the command to be chained.
};
