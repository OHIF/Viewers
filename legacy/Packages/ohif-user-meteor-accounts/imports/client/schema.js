import { OHIF } from 'meteor/ohif:core';
import { ReactiveVar } from 'meteor/reactive-var';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

OHIF.user.schema = new ReactiveVar(new SimpleSchema({
    username: {
        type: String,
        label: 'Username'
    },
    password: {
        type: String,
        label: 'Password'
    }
}));
