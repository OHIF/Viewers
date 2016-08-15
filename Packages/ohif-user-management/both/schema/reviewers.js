import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const ReviewingUserSchema = new SimpleSchema({
    userId: {
        type: String,
        label: 'User ID'
    },
    userName: { // TODO: Remove this
        type: String,
        label: 'Name'
    }
});

export const schema = new SimpleSchema({
    timepointId: {
        type: String,
        label: 'Timepoint ID',
        regEx: SimpleSchema.RegEx.Id
    },
    reviewers: {
        type: [ ReviewingUserSchema ],
        label: 'Reviewing Users'
    }
});
