Template.tabTitle.events({
    'click .close': function(e) {
        var tab = $(e.currentTarget).siblings('a[data-toggle="tab"]').eq(0);
        var contentId = tab.data("target").replace("#", "");
        var tabObjectId = tabs.find({contentid: contentId}).fetch()[0]._id;
        tabs.remove(tabObjectId);

        var tabIndex = tab.parent('li').index();
        var newActiveTabIndex = Math.max(tabIndex - 1, 0);
        var newActiveTab = $(".tabTitle").eq(newActiveTabIndex);
        var newActiveTabLink = newActiveTab.find("a[data-toggle=tab]");
        var newContentId = newActiveTabLink.data("target");
        switchToTab(newContentId);
    }
});

Template.tabTitle.helpers({
    'active': function() {
        return this.active ? "active" : "";
    }
});