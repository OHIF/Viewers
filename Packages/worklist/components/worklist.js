Template.worklist.helpers({
    'tabs': function() {
        console.log('Updating tabs');
        return tabs.find();
    }
});

Template.worklist.events({
    'click a[data-toggle="tab"]': function(e) {
        var contentId = $(e.currentTarget).data('target');
        switchToTab(contentId);
    }
});

switchToTab = function(contentId) {
    var studies = Session.get('StudiesInTab' + contentId);
    var data = {
        studies: studies
    };

    var newContentId = contentId.replace("#", "");
    //var tabObject = tabs.findOne({contentid: newContentId});
    //tabObject.active = true;

    console.log("Switching to tab: " + contentId);
    $('.tabTitle a[data-target="' + contentId + '"]').tab('show');

    $("#viewer").remove();

    var container = $('.tab-content').find(contentId).get(0);
    if (!container) {
        return;
    }

    if (contentId === '#worklistTab') {
        console.log('Switching to worklist');
        document.body.style.overflow = null;
        document.body.style.height = null;
        document.body.style.minWidth = null;
        document.body.style.position = null;
    } else {
        UI.renderWithData(Template.viewer, data, container);
        var imageViewer = $("#viewer");
        if (imageViewer) {
            document.body.style.overflow = "hidden";
            document.body.style.height = '100%';
            document.body.style.width = '100%';
            document.body.style.minWidth = 0;
            document.body.style.position = 'fixed'; // Prevent overscroll on mobile devices
        }
    }
};

Template.worklist.onRendered(function() {
    this.autorun(function() {
        var contentId = Session.get('OpenNewTabEvent');
        if (contentId) {
            switchToTab("#" + contentId);
        }
    });
});