import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const ResponseSchema = new SimpleSchema({
    text: {
        type: String,
        label: 'Text'
    },
    code: {
        type: String,
        label: 'Code'
    },
    selected: {
        type: Boolean,
        label: 'Selected',
        defaultValue: false
    }
});

LocationResponses = new Meteor.Collection(null);
LocationResponses.attachSchema(ResponseSchema);
LocationResponses._debugName = 'LocationResponses';

LocationResponses.insert({
    text: 'Complete response',
    code: 'CR'
});

LocationResponses.insert({
    text: 'Progressive disease',
    code: 'PD'
});

LocationResponses.insert({
    text: 'Stable disease',
    code: 'SD'
});

LocationResponses.insert({
    text: 'Present',
    code: 'Present'
});

LocationResponses.insert({
    text: 'Not Evaluable',
    code: 'NE'
});

LocationResponses.insert({
    text: 'Non-CR/Non-PD',
    code: 'NN'
});

LocationResponses.insert({
    text: 'Excluded from Assessment',
    code: 'EX'
});
