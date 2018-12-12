exports.command = function (email, password) {

  this.verify.elementPresent("#entrySignIn");

  if (email) {
    this
      .verify.elementPresent("#signInPageEmailInput")
      .clearValue("#signInPageEmailInput")
      .setValue("#signInPageEmailInput", email);
  }


  if (password) {
    this
      .verify.elementPresent("#signInPagePasswordInput")
      .clearValue("#signInPagePasswordInput")
      .setValue("#signInPagePasswordInput", password);
  }

  this.click("#signInToAppButton").pause(1000);

  return this;
};
