exports.command = function (email, password, fullName, message) {
  this
    .verify.elementPresent("#entrySignUp")
    .verify.elementPresent("#signUpPageTitle")
    .verify.elementPresent("#signUpPageMessage")
    .verify.elementPresent("#signUpPageFullNameInput")
    .verify.elementPresent("#signUpPageEmailInput")
    .verify.elementPresent("#signUpPagePasswordInput")
    .verify.elementPresent("#signUpPagePasswordConfirmInput")

    .verify.elementPresent("#signUpPageJoinNowButton")
    .verify.elementPresent("#signUpPageSignInButton");

  if (email) {
    this.verify.containsText("#signUpPageEmailInput", email);
  }
  if (password) {
    this.verify.containsText("#signUpPagePasswordInput", password)
      .verify.containsText("#signUpPagePasswordConfirmInput", password);
  }
  if (fullName) {
    this.verify.containsText("#signUpPageFullNameInput", fullName);
  }
  if (message) {
    this.verify.elementPresent("#errorMessages")
      .verify.containsText("#errorMessages", message);
  }


  return this;
};
