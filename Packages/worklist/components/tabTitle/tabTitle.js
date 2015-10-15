Template.tabTitle.events({
    'click .close': function(e) {
        var tab = $(e.currentTarget).parents('[data-toggle="tab"]').eq(0);
        var contentId = tab.data("target").replace("#","");
        var tabObjectId = tabs.find({contentid: contentId}).fetch()[0]._id;
        tabs.remove(tabObjectId);

        var tabIndex = tab.index();
        var newActiveTabIndex = Math.max(tabIndex - 1, 0);
        if (newActiveTabIndex === 0) {
            $('a[data-target="#worklistTab"]').addClass('active').tab('show');
            return;
        }

        var newActiveTab = $(".tabTitle").eq(newActiveTabIndex);
        var newContentId = newActiveTab.data("contentid");

        var tabObject = tabs.find({contentId: newContentId}).fetch()[0];
        tabObject.active = true;
    }
});