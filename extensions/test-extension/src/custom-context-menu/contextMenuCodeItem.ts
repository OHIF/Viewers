const codeMenuItem = {
  id: '@ohif/contextMenuAnnotationCode',

  /** Applies the code value setup for this item */
  transform: function (customizationService) {
    const { code: codeRef } = this;
    if (!codeRef) {
      throw new Error(`item ${this} has no code ref`);
    }
    const codingValues = customizationService.get('codingValues');
    const code = codingValues[codeRef];
    return {
      ...this,
      codeRef,
      code: { ref: codeRef, ...code },
      label: code.text,
      commands: [
        {
          commandName: 'updateMeasurement',
        },
      ],
    };
  },
};

export default codeMenuItem;
