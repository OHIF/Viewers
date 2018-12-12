exports.command = function (fullname) {
  this
    .sectionBreak(".signOut()");

  if (fullname) {
    this
      .verify.elementPresent("#usernameLink")
      .verify.containsText("#usernameLink", fullname);
  }

  this
    .verify.elementPresent("#logoutLink")
    .click("#logoutLink").pause(1000);

  if (fullname) {
    this
      .verify.elementPresent("#usernameLink")
      .verify.containsText("#usernameLink", "Sign In");
  }

  return this;
};
