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
        UI.render(Template.imageViewerViewports, container);

        var currentCell = $(evt.currentTarget);
        var rowIndex = currentCell.closest('tr').index();
        var columnIndex = currentCell.index();

        // Add 1 because the indices start from zero
        Session.set('viewportRows', rowIndex + 1);
        Session.set('viewportColumns', columnIndex + 1);
    }
});