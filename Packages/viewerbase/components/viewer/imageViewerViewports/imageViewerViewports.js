Template.imageViewerViewports.helpers({
  height: function() {
    var viewportRows;
    if (!Template.parentData(1).viewportRows) {
        viewportRows = 1;
    } else {
        viewportRows = Template.parentData(1).viewportRows.get();
    }
    return 100 / viewportRows;
  },
  width: function() {
    var viewportColumns;
    if (!Template.parentData(1).viewportColumns) {
        viewportColumns = 1;
    } else {
        viewportColumns = Template.parentData(1).viewportColumns.get();
    }
    return 100 / viewportColumns;
  },
  viewportArray: function() {
    // This is a really annoying thing to have to do, but Meteor
    // doesn't want to let me use another type of helper.
    var viewportRows;
    if (!this.viewportRows) {
        viewportRows = 1;
    } else {
        viewportRows = this.viewportRows.get();
    }

    var viewportColumns;
    if (!this.viewportColumns) {
        viewportColumns = 1;
    } else {
        viewportColumns = this.viewportColumns.get();
    }
    
    var numViewports = viewportRows * viewportColumns;

    var array = [];
    for (var i=0; i < numViewports; ++i) {
        var data = {
            viewportIndex: i,
            studies: this.studies,
            activeViewport: this.activeViewport
        };
        array.push(data);
    }
    return array;
  },
});