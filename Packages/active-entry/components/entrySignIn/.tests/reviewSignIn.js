exports.command = function (email, password, title, message) {
  this
    // .verify.element("#entrySignIn").to.be.visible
    // .verify.element("#signInPageTitle").to.be.visible
    // .verify.element("#signInPageMessage").to.be.visible
    // .verify.element("#signInPageEmailInput").to.be.visible
    // .verify.element("#signInPagePasswordInput").to.be.visible
    // .verify.element("#signInToAppButton").to.be.visible
    // .verify.element("#needAnAccountButton").to.be.visible
    //

    .verify.elementPresent("#entrySignIn")
    .verify.elementPresent("#signInPageTitle")
    .verify.elementPresent("#signInPageMessage")
    .verify.elementPresent("#signInPageEmailInput")
    .verify.elementPresent("#signInPagePasswordInput")
    .verify.elementPresent("#signInToAppButton")
    .verify.elementPresent("#needAnAccountButton");

  if (email) {
    this.verify.containsText("#signInPageEmailInput", email);
  }
  if (password) {
    this.verify.containsText("#signInPageEmailInput", password);
  }

  if (title) {
    this.verify.containsText("#signInPageTitle", title);
  }
  if (message) {
    this.verify.containsText("#signInPageMessage", message);
  }

  return this;
};
