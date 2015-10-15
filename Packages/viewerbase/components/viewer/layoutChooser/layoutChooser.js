function highlightCells(currentCell) {
    var cells = $('.layoutChooser table td');
    cells.removeClass('hover');

    currentCell = $(currentCell);
    var table = currentCell.parents('.layoutChooser table').get(0);
    var rowIndex = currentCell.closest('tr').index();
    var columnIndex = currentCell.index();

    // Loop through the table row by row
    // and cell by cell to apply the highlighting
    for (var i = 0; i < table.rows.length; i++) {
        row = table.rows[i];
        if (i <= rowIndex) {
           for (var j = 0; j < row.cells.length; j++) {
                if (j <= columnIndex) {
                    cell = row.cells[j];
                    cell.classList.add('hover');
                }
           }
        }
    }
}
Template.layoutChooser.events({
    'touchstart .layoutChooser table td, mouseenter .layoutChooser table td': function(evt) {
        highlightCells(evt.currentTarget);
    },
    'click .layoutChooser table td': function(evt) {
        $('#imageViewerViewports').remove();
        var container = $(".viewerMain").get(0);

        var currentCell = $(evt.currentTarget);
        var rowIndex = currentCell.closest('tr').index();
        var columnIndex = currentCell.index();

        var data = {};

        // Add 1 because the indices start from zero
        if (this.viewportRows) {
            this.viewportRows.set(rowIndex + 1);
            data.viewportRows = this.viewportRows;
        } else {
            data.viewportRows = 1;
        }

        if (this.viewportColumns) {
            this.viewportColumns.set(columnIndex + 1);
            data.viewportColumns = this.viewportColumns;
        } else {
            data.viewportColumns = 1;
        }

        data.studies = Template.parentData(2).studies;
        data.activeViewport = Template.parentData(2).activeViewport;
        UI.renderWithData(Template.imageViewerViewports, data, container);
    }
});