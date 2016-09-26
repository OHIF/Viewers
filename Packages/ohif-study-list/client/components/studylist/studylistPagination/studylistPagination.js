import { Template } from 'meteor/templating';

import './studylistPagination.html';

const visiblePages = 10;
Template.studylistPagination.onCreated(function() {
    let instance = Template.instance();
    // replace parentVariable with the name of the instance variable
    instance.parent = this.parent(1);
});

Template.studylistPagination.onRendered(function() {
    const instance = Template.instance();
    const $paginationControl = instance.$('#pagination');

    // Track changes on recordCount and rowsPerPage
    instance.autorun(function() {
        const recordCount = instance.parent.recordCount.get();
        const rowsPerPage = instance.parent.rowsPerPage.get();

        // Destroy plugin if exists
        if ($paginationControl.data().twbsPagination) {
            $paginationControl.twbsPagination('destroy');
        }

        if (recordCount && rowsPerPage) {
            const totalPageNumber = Math.ceil(recordCount / rowsPerPage);

            // Initialize plugin
            $paginationControl.twbsPagination({
                totalPages: totalPageNumber,
                visiblePages: visiblePages,
                onPageClick: function (event, page) {
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
    }
});

Template.studylistPagination.events({
    'change .js-select-rows-per-page'(event, instance) {
        const rowsPerPage = $(event.currentTarget).val();

        // Update rowsPerPage of parent
        instance.parent.rowsPerPage.set(parseInt(rowsPerPage, 10));
    }
});
