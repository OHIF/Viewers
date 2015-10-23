ViewerData = Session.get('ViewerData') || {};

Template.worklist.helpers({
    'tabs': function() {
        console.log('Updating tabs');
        return tabs.find();
    }
});

Template.worklist.events({
    'click a[data-toggle="tab"]': function(e) {
        var contentId = $(e.currentTarget).data('target').replace("#", "");
        switchToTab(contentId);
    }
});

switchToTab = function(contentId) {
    var data = ViewerData[contentId];

    console.log("Switching to tab: " + contentId);
    $('.tabTitle a[data-target="#' + contentId + '"]').tab('show');

    $("#viewer").remove();

    var container = $('.tab-content').find("#" + contentId).get(0);
    if (!container) {
        return;
    }

    if (contentId === 'worklistTab') {
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
        var data = Session.get('OpenNewTabEvent');

        // If we have no new tab data, stop here
        // (e.g. if we are rendering the worklist)
        if (!data) {
            return;
        }

        var contentId = data.contentid;
        if (ViewerData.hasOwnProperty(contentId)) {
            console.warn('Contentid already exists?');
            return;
        }

        // Update the viewer data object
        ViewerData[contentId] = {
            contentId: contentId,
            studies: data.studies,
            title: data.title
        };
        Session.set('ViewerData', ViewerData);

        switchToTab(contentId);
    });
});