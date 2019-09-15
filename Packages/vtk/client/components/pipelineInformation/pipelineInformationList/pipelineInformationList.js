import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Pipelines } from 'meteor/gtajesgenga:vtk/both/collections';

Template.pipelineInformationList.onCreated(function() {

    this.autorun(() => {
        this.subscribe('pipelines.publication', Pipelines.find({}, {}).fetch());
    });

    const instance = Template.instance();

    instance.api = {
        add: () => instance.data.mode.set('create'),

        edit(pipeline) {
            instance.data.currentItem.set(pipeline);
            instance.data.mode.set('edit');
        },

        delete(pipeline) {
            // TODO: Replace this for confirmation dialog after LT-refactor is merged back to master
            if (!window.confirm('Are you sure you want to remove this pipeline?')) {
                return;
            }

            Meteor.call('pielineRemove', pipeline._id, error => {
                // TODO: check for errors: data-write
            });
        }
    };
});

Template.pipelineInformationList.helpers({

    pipelines: function() {
        return Pipelines.find({}, {}).fetch();
    }
});
