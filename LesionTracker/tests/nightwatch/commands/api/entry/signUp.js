exports.command = function(email, password) {

  this
    .waitForElementVisible('#entrySignUp', 1000)
      .verify.elementPresent("#signUpPageEmailInput")
      .verify.elementPresent("#signUpPagePasswordInput")
      .verify.elementPresent("#signUpPagePasswordConfirmInput")

      .clearValue("#signUpPageEmailInput")
      .clearValue("#signUpPagePasswordInput")
      .clearValue("#signUpPagePasswordConfirmInput")

      // .setValue("#signUpPageUsernameInput", "Jane Doe")
      .setValue("#signUpPageEmailInput", email)
      .setValue("#signUpPagePasswordInput", password)
      .setValue("#signUpPagePasswordConfirmInput", password)

      .click("#signUpPageJoinNowButton").pause(200)



  return this; // allows the command to be chained.
};
