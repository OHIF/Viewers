Template.tabTitle.events({
    'click .close': function(e) {
        var tab = $(e.currentTarget).parents('a[data-toggle="tab"]').eq(0);
        var contentId = tab.data("target").replace("#", "");

        var tabIndex = tab.parent('li').index();
        var newActiveTabIndex = Math.max(tabIndex - 1, 0);
        var newActiveTab = $(".tabTitle").eq(newActiveTabIndex);
        var newActiveTabLink = newActiveTab.find("a[data-toggle=tab]");
        var newContentId = newActiveTabLink.data("target").replace("#", "");

        switchToTab(newContentId);
        
        var tabObjectId = tabs.find({contentid: contentId}).fetch()[0]._id;
        tabs.remove(tabObjectId);

        delete ViewerData[contentId];
    }
});