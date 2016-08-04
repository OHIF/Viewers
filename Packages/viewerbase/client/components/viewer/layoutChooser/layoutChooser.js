/**
 * Adds the 'hover' class to cells above and to the left of the current cell
 * This is used to "fill in" the grid that the user will change the layout to,
 * if they click on a specific table cell.
 *
 * @param currentCell
 */
function highlightCells(currentCell) {
    const cells = $('.layoutChooser table td');
    cells.removeClass('hover');

    currentCell = $(currentCell);
    const table = currentCell.parents('.layoutChooser table').get(0);
    const rowIndex = currentCell.closest('tr').index();
    const columnIndex = currentCell.index();

    // Loop through the table row by row
    // and cell by cell to apply the highlighting
    for (var i = 0; i < table.rows.length; i++) {
        const row = table.rows[i];
        if (i <= rowIndex) {
            for (var j = 0; j < row.cells.length; j++) {
                if (j <= columnIndex) {
                    const cell = row.cells[j];
                    cell.classList.add('hover');
                }
            }
        }
    }
}

Template.layoutChooser.events({
    'touchstart .layoutChooser table td, mouseenter .layoutChooser table td'(evt) {
        highlightCells(evt.currentTarget);
    },

    'click .layoutChooser table td'(evt) {
        const currentCell = $(evt.currentTarget);
        const rowIndex = currentCell.closest('tr').index();
        const columnIndex = currentCell.index();

        // Add 1 because the indices start from zero
        const layoutProps = {
            rows: rowIndex + 1,
            columns: columnIndex + 1
        };

        window.layoutManager.layoutTemplateName = 'gridLayout';
        window.layoutManager.layoutProps = layoutProps;
        window.layoutManager.updateViewports();

        const $dropdown = $('.layoutChooser');
        toggleDialog($dropdown);
    }
});
