ViewerData = Session.get('ViewerData') || {};
StudyMetaData = {};

getStudyMetadata = function(studyInstanceUid, doneCallback) {
    log.info('worklistStudy getStudyMetadata');

    if (StudyMetaData.hasOwnProperty(studyInstanceUid) && StudyMetaData[studyInstanceUid]) {
        var study = StudyMetaData[studyInstanceUid];
        doneCallback(study);
        return;
    }

    Meteor.call('GetStudyMetadata', studyInstanceUid, function(error, study) {
        sortStudy(study);
        
        StudyMetaData[studyInstanceUid] = study;

        doneCallback(study);
    });
};

switchToTab = function(contentId) {
    log.info("Switching to tab: " + contentId);

    $('.tabTitle a[data-target="#' + contentId + '"]').tab('show');

    $("#viewer").remove();

    if (contentId === 'worklistTab') {
        document.body.style.overflow = null;
        document.body.style.height = null;
        document.body.style.minWidth = null;
        document.body.style.position = null;
        return;
    }

    // Set active tab
    Session.set("activeContentId", contentId);

    // Get tab content container
    var container = $('.tab-content').find("#" + contentId).get(0);
    if (!container) {
        return;
    }
    
    var studyInstanceUid = ViewerData[contentId].studyInstanceUid;
    getStudyMetadata(studyInstanceUid, function(study) {
        var data = {
            viewportRows: ViewerData[contentId].viewportRows,
            viewportColumns: ViewerData[contentId].viewportColumns,
            contentId: contentId,
            studies: [study],
        };

        Session.set('studies', data.studies);

        UI.renderWithData(Template.viewer, data, container);
        var imageViewer = $("#viewer");
        if (imageViewer) {
            document.body.style.overflow = "hidden";
            document.body.style.height = '100%';
            document.body.style.width = '100%';
            document.body.style.minWidth = 0;
            document.body.style.position = 'fixed'; // Prevent overscroll on mobile devices
        }
    });
};


openNewTab = function(studyInstanceUid) {
    getStudyMetadata(studyInstanceUid, function(study) {
        var title = study.seriesList[0].instances[0].patientName;
        var contentid = generateUUID();

        var data = {
            title: title,
            contentid: contentid,
        };
        tabs.insert(data);

        ViewerData[contentid] = {
            title: title,
            contentid: contentid,
            studyInstanceUid: studyInstanceUid
        };
        switchToTab(contentid);
    });
};

Template.worklist.onRendered(function() {
    // If there is a tab set as active in the Session,
    // switch to that now.
    var contentId = Session.get("activeContentId");
    if (contentId) {
        switchToTab(contentId);
    }
});


Template.worklist.helpers({
    'tabs': function() {
        log.info('Updating tabs');
        return tabs.find();
    }
});

Template.worklist.events({
    'click a[data-toggle="tab"]': function(e) {
        var contentId = $(e.currentTarget).data('target').replace("#", "");
        switchToTab(contentId);
    }
});