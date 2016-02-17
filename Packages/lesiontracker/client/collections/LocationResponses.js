LocationResponses = new Meteor.Collection(null);
LocationResponses._debugName = 'LocationResponses';

LocationResponses.insert({
    text: 'Complete response',
    code: 'CR',
    description: ''
});

LocationResponses.insert({
    text: 'Progressive disease',
    code: 'PD',
    description: ''
});

LocationResponses.insert({
    text: 'Stable disease',
    code: 'SD',
    description: ''
});

LocationResponses.insert({
    text: 'Present',
    code: 'Present',
    description: ''
});

LocationResponses.insert({
    text: 'Not Evaluable',
    code: 'NE',
    description: ''
});

LocationResponses.insert({
    text: 'Non-CR/Non-PD',
    code: 'NN',
    description: ''
});

LocationResponses.insert({
    text: 'Excluded from Assessment',
    code: 'EX',
    description: ''
});
