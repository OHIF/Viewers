import { Template } from 'meteor/templating';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import './studylistPagination.html';

const visiblePages = 10;

Template.studylistPagination.onCreated(function() {
    const instance = Template.instance();
    // replace parentVariable with the name of the instance variable
    instance.parent = this.parent(1);
    instance.schema = new SimpleSchema({
        rowsPerPage: {
            type: Number,
            allowedValues: [25, 50, 100],
            defaultValue: 25
        }
    });
});

Template.studylistPagination.onRendered(() => {
    const instance = Template.instance();
    const $paginationControl = instance.$('.pagination-control');

    // Track changes on recordCount and rowsPerPage
    instance.autorun(() => {
        const recordCount = instance.parent.recordCount.get();
        const rowsPerPage = instance.parent.rowsPerPage.get();

        // Destroy plugin if exists
        if ($paginationControl.data().twbsPagination) {
            $paginationControl.twbsPagination('destroy');
        }

        if (recordCount && rowsPerPage) {
            const totalPages = Math.ceil(recordCount / rowsPerPage);

            // Initialize plugin
            $paginationControl.twbsPagination({
                totalPages,
                visiblePages,
                onPageClick: (event, page) => {
                    // Update currentPage
                    // Decrease page by 1 to set currentPage
                    // Since reactive table current page index starts by 0
                    instance.parent.currentPage.set(page - 1);
                }
            });
        }
    });
});

Template.studylistPagination.helpers({
    recordCount() {
        const instance = Template.instance();
        return instance.parent.recordCount.get();
    },

    isRowsPerPageSelected(rowsPerPage) {
        const instance = Template.instance();
        return rowsPerPage === instance.parent.rowsPerPage.get();
    }
});

Template.studylistPagination.events({
    'change .js-select-rows-per-page'(event, instance) {
        const rowsPerPage = $(event.currentTarget).val();

        // Update rowsPerPage of parent
        instance.parent.rowsPerPage.set(parseInt(rowsPerPage, 10));
    }
});
