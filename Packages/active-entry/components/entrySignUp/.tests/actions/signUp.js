exports.command = function (email, password, fullName) {

  this.verify.elementPresent("#entrySignUp");

  if (email) {
    this
      .verify.elementPresent("#signUpPageEmailInput")
      .clearValue("#signUpPageEmailInput")
      .setValue("#signUpPageEmailInput", email);
  }


  if (password) {
    this
      .verify.elementPresent("#signUpPagePasswordInput")
      .clearValue("#signUpPagePasswordInput")
      .setValue("#signUpPagePasswordInput", password)

    .verify.elementPresent("#signUpPagePasswordConfirmInput")
      .clearValue("#signUpPagePasswordConfirmInput")
      .setValue("#signUpPagePasswordConfirmInput", password);
  }


  if (fullName) {
    this
      .verify.elementPresent("#signUpPageFullNameInput")
      .clearValue("#signUpPageFullNameInput")
      .setValue("#signUpPageFullNameInput", fullName);
  }


  this.click("#signUpPageJoinNowButton").pause(300);


  return this;
};
