const comparators = [{
    id: 'equals',
    name: '= (Equals)',
    validator: 'equals',
    validatorOption: 'value',
    description: 'The attribute must equal this value.'
}, {
    id: 'doesNotEqual',
    name: '!= (Does not equal)',
    validator: 'doesNotEqual',
    validatorOption: 'value',
    description: 'The attribute must not equal this value.'
}, {
    id: 'contains',
    name: 'Contains',
    validator: 'contains',
    validatorOption: 'value',
    description: 'The attribute must contain this value.'
}, {
    id: 'doesNotContain',
    name: 'Does not contain',
    validator: 'doesNotContain',
    validatorOption: 'value',
    description: 'The attribute must not contain this value.'
}, {
    id: 'startsWith',
    name: 'Starts with',
    validator: 'startsWith',
    validatorOption: 'value',
    description: 'The attribute must start with this value.'
}, {
    id: 'endsWith',
    name: 'Ends with',
    validator: 'endsWith',
    validatorOption: 'value',
    description: 'The attribute must end with this value.'
}, {
    id: 'onlyInteger',
    name: 'Only Integers',
    validator: 'numericality',
    validatorOption: 'onlyInteger',
    description: "Real numbers won't be allowed."
}, {
    id: 'greaterThan',
    name: '> (Greater than)',
    validator: 'numericality',
    validatorOption: 'greaterThan',
    description: 'The attribute has to be greater than this value.'
}, {
    id: 'greaterThanOrEqualTo',
    name: '>= (Greater than or equal to)',
    validator: 'numericality',
    validatorOption: 'greaterThanOrEqualTo',
    description: 'The attribute has to be at least this value.'
}, {
    id: 'lessThanOrEqualTo',
    name: '<= (Less than or equal to)',
    validator: 'numericality',
    validatorOption: 'lessThanOrEqualTo',
    description: 'The attribute can be this value at the most.'
}, {
    id: 'lessThan',
    name: '< (Less than)',
    validator: 'numericality',
    validatorOption: 'lessThan',
    description: 'The attribute has to be less than this value.'
}, {
    id: 'odd',
    name: 'Odd',
    validator: 'numericality',
    validatorOption: 'odd',
    description: 'The attribute has to be odd.'
}, {
    id: 'even',
    name: 'Even',
    validator: 'numericality',
    validatorOption: 'even',
    description: 'The attribute has to be even.'
}];

// Immutable object
Object.freeze(comparators);

export { comparators }