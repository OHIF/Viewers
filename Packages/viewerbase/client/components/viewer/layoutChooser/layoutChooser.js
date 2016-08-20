Template.layoutChooser.onRendered(() => {
    const instance = Template.instance();

    /**
     * Adds the 'hover' class to cells above and to the left of the current cell
     * This is used to "fill in" the grid that the user will change the layout to,
     * if they click on a specific table cell.
     *
     * @param currentCell
     */
    instance.highlightCells = currentCell => {
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
    };

    // Refresh layout chooser highlighting based on current viewports state
    instance.refreshHighlights = () => {
        // Stop here if layoutManager is not defined yet
        if (!window.layoutManager) {
            return;
        }

        // Get the layout rows and columns amount
        const info = window.layoutManager.layoutProps;

        // get the limiter cell
        const cell = instance.$('tr').eq(info.rows - 1).children().eq(info.columns - 1);

        // Highlight all cells before the limiter
        instance.highlightCells(cell);
    };

    instance.autorun(() => {
        // Run this computation every time the viewer layout is changed
        Session.get('LayoutManagerUpdated');

        instance.refreshHighlights();
    });
});

Template.layoutChooser.events({
    'touchstart .layoutChooser table td, mouseenter .layoutChooser table td'(event, instance) {
        instance.highlightCells(event.currentTarget);
    },

    'mouseleave .layoutChooser'(event, instance) {
        instance.refreshHighlights();
    },

    'click .layoutChooser table td'(event, instance) {
        const $currentCell = $(event.currentTarget);
        const rowIndex = $currentCell.closest('tr').index();
        const columnIndex = $currentCell.index();

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
