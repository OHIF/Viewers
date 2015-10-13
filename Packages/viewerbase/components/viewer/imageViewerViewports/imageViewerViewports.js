function getNumViewports() {
    var viewportRows = Session.get('viewportRows');
    var viewportColumns = Session.get('viewportColumns');
    return viewportRows * viewportColumns;
}

Template.imageViewerViewports.helpers({
  height: function() {
    var viewportRows = Session.get('viewportRows');
    return 100 / viewportRows;
  },
  width: function() {
    var viewportColumns = Session.get('viewportColumns');
    return 100 / viewportColumns;
  },
  viewportArray: function() {
    // This is a really annoying thing to have to do, but Meteor
    // doesn't want to let me use another type of helper.
    var numViewports = getNumViewports();

    var array = [];
    for (var i=0; i < numViewports; ++i) {
        var data = {
            viewportIndex: i
        };
        array.push(data);
    }
    return array;
  }
});