//Holds functions to help managing tabs

//Returns activeTabId
function activeTabId() {
    var activeTab = Session.get("activeTabId");
    return activeTab;
}

//Returns activeTabContentId
function activeTabContentId () {
    var activeTabId = activeTabId();
    var splitTabId = activeTabId.split("tab");
    var contentId = "content"+splitTabId[1];
    return contentId;
}