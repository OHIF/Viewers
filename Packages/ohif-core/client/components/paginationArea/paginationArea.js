import { Template } from 'meteor/templating';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { $ } from 'meteor/jquery';

Template.paginationArea.onCreated(function() {
    const instance = Template.instance();

    // Create the rowsPerPage schema
    instance.schema = new SimpleSchema({
        rowsPerPage: {
            type: Number,
            allowedValues: [25, 50, 100],
            defaultValue: 25
        }
    });
});

Template.paginationArea.onRendered(() => {
    const instance = Template.instance();

    // Track changes on recordCount and rowsPerPage
    instance.autorun(() => {
        const recordCount = instance.data.recordCount.get();
        const rowsPerPage = instance.data.rowsPerPage.get();
        const currentPage = instance.data.currentPage.get();

        Meteor.defer(() => {
            const prevButton = instance.$('.prev')[0];
            const nextButton = instance.$('.next')[0];
            if (!prevButton || !nextButton) {
                return;
            }

            // Enable if there are potentially more records, otherwise disable it
            if (recordCount >= rowsPerPage) {
                nextButton.classList.remove('disabled');
            } else {
                nextButton.classList.add('disabled');
            }

            // Enable the previous button if it is not the first page, otherwise disable it
            if (currentPage > 0) {
                prevButton.classList.remove('disabled');
            } else {
                prevButton.classList.add('disabled');
            }
        });
    });
});

Template.paginationArea.helpers({
    paginationButtonsEnabled() {
        const instance = Template.instance();

        const recordCount = instance.data.recordCount.get();
        const rowsPerPage = instance.data.rowsPerPage.get();
        const currentPage = instance.data.currentPage.get();

        // Show pagination if it is not first page or there are potentially more records
        return currentPage > 0 || recordCount >= rowsPerPage;
    }
});

Template.paginationArea.events({
    'click .prev > a'(event, instance) {
        const currentPage = instance.data.currentPage.get();
        instance.data.currentPage.set(currentPage - 1);
    },

    'click .next > a'(event, instance) {
        const currentPage = instance.data.currentPage.get();
        instance.data.currentPage.set(currentPage + 1);
    },

    'change [data-key=rowsPerPage]'(event, instance) {
        const rowsPerPage = $(event.currentTarget).data('component').value();

        // Update rowsPerPage
        instance.data.rowsPerPage.set(parseInt(rowsPerPage, 10));
        instance.data.currentPage.set(0);
    }
});
