export default {
  '@ohif/contextMenuAnnotationCode': {
    /** Applies the code value setup for this item */
    $transform: function (customizationService) {
      const { code: codeRef } = this;
      if (!codeRef) {
        throw new Error(`item ${this} has no code ref`);
      }
      const codingValues = customizationService.getCustomization('codingValues');
      const code = codingValues[codeRef];
      return {
        ...this,
        codeRef,
        code: { ref: codeRef, ...code },
        label: this.label || code.text || codeRef,
        commands: [
          {
            commandName: 'updateMeasurement',
          },
        ],
      };
    },
  },
};
