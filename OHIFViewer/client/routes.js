Session.setDefault('ViewerData', {});

// Re-add any tab data saved in the Session
WorklistTabs.remove({});
Object.keys(ViewerData).forEach(function(contentId) {
    var tabData = ViewerData[contentId];
    var data = {
        title: tabData.title,
        contentid: tabData.contentid
    };
    WorklistTabs.insert(data);
});

Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'layout'
});

Router.onBeforeAction('loading');

Router.route('/', function() {
    this.render('worklist');
});

Router.route('/worklist', function() {
    this.render('worklist');
});

Router.route('/viewer/:_id', {
    layoutTemplate: 'layout',
    name: 'viewer',
    onBeforeAction: function() {
        var studyInstanceUid = this.params._id;
        
        // Check if this study is already loaded in a tab
        // If it is, stop here so we don't keep adding tabs on hot-code reloads
        var tabs = WorklistTabs.find({
            studyInstanceUid: studyInstanceUid
        });
        if (tabs.count()) {
            return;
        }

        this.render('worklist', {
            data: function() {
                return {
                    studyInstanceUid: studyInstanceUid
                };
            }
        });
    }
});
