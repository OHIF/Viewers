exports.command = function(email, password) {

  this
    .verify.elementPresent("#logoutButton")
    .click("#logoutButton").pause(500)

  return this; // allows the command to be chained.
};
