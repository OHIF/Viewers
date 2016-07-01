import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

// TODO: Check why I can't use absolute paths for this? Keeps saying module not found
import { AdditionalFinding } from '../../../both/schema/additionalFinding';

Template.additionalFindings.onCreated(function additionalFindingsOnCreated() {
    console.log('additionalFindingsOnCreated');
    const instance = Template.instance();

    instance.currentSchema = AdditionalFinding;
    instance.state = new ReactiveDict();

    if (!instance.data.currentTimepointId) {
        console.warn('Case has no timepointId');
        return;
    }

    const currentTimepointId = instance.data.currentTimepointId;
    if (!currentTimepointId) {
        console.warn('No currentTimepointId');
    }

    console.log(AdditionalFindings.find().fetch());
    const additionalFindings = AdditionalFindings.findOne({
        timepointId: currentTimepointId
    });

    if (additionalFindings) {
        instance.id = additionalFindings._id;

        // Don't store the MongoDB Id in the ReactiveDict
        delete additionalFindings._id;

        instance.state.set(additionalFindings);
    } else {
        const defaultData = instance.currentSchema.clean({});
        instance.state.set(defaultData);

        // Include patientId and timepointId
        defaultData.patientId = Session.get('patientId');
        defaultData.timepointId = currentTimepointId;

        // TODO: Turn this into a Meteor Call to insert it on the server
        instance.id = AdditionalFindings.insert(defaultData);
    }
});

Template.additionalFindings.onRendered(function additionalFindingsOnRendered() {
    const instance = Template.instance();

    instance.autorun(() => {
        console.log('Updating AdditionalFindings Collection');
        console.log(instance.state.all());

        // TODO: Turn this into a Meteor Call to update it on the server
        let update = instance.state.all();
        AdditionalFindings.update(instance.id, {
            $set: update
        });
    });
});

Template.additionalFindings.helpers({
    // We need these helper methods
    // since we assign them into instance object instead of instance.data
    currentSchema() {
        return Template.instance().currentSchema;
    },

    state() {
        return Template.instance().state;
    },

    regionsOfMetastaticDiseaseSelect2Options() {
        return {
            placeholder: 'Search Regions',
            allowClear: true,
            multiple: true
        };
    }
});
