import { SimpleSchema } from 'meteor/aldeed:simple-schema';

/*
 Extend the available options on schema definitions:

  * valuesLabels: Used in conjunction with allowedValues to define the text
    label for each value (used on forms)

  * textOptional: Used to allow empty strings

 */
SimpleSchema.extendOptions({
    valuesLabels: Match.Optional([String]),
    textOptional: Match.Optional(Boolean)
});

// Add default required validation for empty strings which can be bypassed
// using textOptional=true definition
SimpleSchema.addValidator(function() {
    if (
        this.definition.optional !== true &&
        this.definition.textOptional !== true &&
        this.value === ''
    ) {
        return 'required';
    }
});

// Including [label] for some messages
SimpleSchema.messages({
    maxCount: '[label] can not have more than [maxCount] values',
    minCount: '[label] must have at least [minCount] values',
    notAllowed: '[label] has an invalid value: "[value]"'
});
