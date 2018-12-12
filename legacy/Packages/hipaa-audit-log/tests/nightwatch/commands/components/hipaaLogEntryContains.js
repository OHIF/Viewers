


exports.command = function(rowIndex, hipaaEvent) {
  this
    .verify.elementPresent("#hipaaAuditLog .hipaaAuditItem:nth-child(" + rowIndex + ")")

  if(hipaaEvent.type === "create"){
    this
      .verify.elementPresent("#hipaaAuditLog .hipaaAuditItem:nth-child(" + rowIndex + ") .userName", hipaaEvent.userName)
      .verify.elementPresent("#hipaaAuditLog .hipaaAuditItem:nth-child(" + rowIndex + ") .recordId", hipaaEvent.recordId)
      .verify.elementPresent("#hipaaAuditLog .hipaaAuditItem:nth-child(" + rowIndex + ") .collectionName", hipaaEvent.collectionName)

      if(hipaaEvent.patientName){
        this.verify.elementPresent("#hipaaAuditLog .hipaaAuditItem:nth-child(" + rowIndex + ") .patientName", hipaaEvent.patientName)
      }
  }

  return this;
};
