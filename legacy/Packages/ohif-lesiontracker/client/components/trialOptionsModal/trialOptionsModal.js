import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

Meteor.startup(() => {
    const TrialCriteriaTypes = new Meteor.Collection(null);
    TrialCriteriaTypes._debugName = 'TrialCriteriaTypes';

    TrialCriteriaTypes.insert({
        id: 'RECIST',
        name: 'RECIST 1.1',
        descriptionTemplate: 'recistDescription',
        selected: true
    });

    TrialCriteriaTypes.insert({
        id: 'irRC',
        name: 'irRC',
        descriptionTemplate: 'irRCDescription',
        selected: false
    });

    OHIF.lesiontracker.TrialCriteriaTypes = TrialCriteriaTypes;
});

Template.trialOptionsModal.onCreated(() => {
    const instance = Template.instance();
    const { TrialCriteriaTypes } = OHIF.lesiontracker;
    const types = TrialCriteriaTypes.find().fetch();
    const defaultValue = _.findWhere(types, { selected: true })._id;
    instance.selectedTrial = new ReactiveVar(defaultValue);

    instance.schema = new SimpleSchema({
        trialCriteria: {
            type: String,
            allowedValues: _.pluck(types, '_id'),
            valuesLabels: _.pluck(types, 'name'),
            defaultValue
        }
    });

    instance.data.promise.then(formData => {
        // Set "selected" to false for the entire collection
        TrialCriteriaTypes.update({}, {
            $set: { selected: false }
        }, {
            multi: true
        });

        // TODO: Use filter with "_id: $in" when allowing multiple criteria
        // Set "selected" to true for the current criteria
        TrialCriteriaTypes.update(formData.trialCriteria, {
            $set: { selected: true }
        });
    });
});

Template.trialOptionsModal.helpers({
    getDescriptionTemplate(_id) {
        return OHIF.lesiontracker.TrialCriteriaTypes.findOne(_id).descriptionTemplate;
    }
});

Template.trialOptionsModal.events({
    'change .js-trial'(event, instance) {
        const form = instance.$('form').first().data('component');
        if (!form) return;
        instance.selectedTrial.set(form.value().trialCriteria);
    }
});
