import { Template } from 'meteor/templating';

import './helpBlock.html';

Template.helpBlock.onCreated(function helpBlockOnCreated() {
    var instance = this;

    // Invalid keys comes from Trials schema
    instance.invalidKeys = this.data.invalidKeys;
});