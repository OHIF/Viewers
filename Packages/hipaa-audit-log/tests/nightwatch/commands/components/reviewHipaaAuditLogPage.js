

exports.command = function() {
  this
    .verify.elementPresent("#hipaaLogPage")
    .verify.elementPresent("#hipaaAuditLog")

  return this; 
};
