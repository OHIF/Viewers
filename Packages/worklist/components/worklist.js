var contentID = "";

//Generate UUID to create unique tabs
function generateUUID () {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*8)%8 | 0;
        d = Math.floor(d/8);
        return (c=='x' ? r : (r&0x3|0x8)).toString(8);
    });
    return uuid;
}

//Remove tab
function removeTab (uuid) {
    var removedTabIndex = $("#tab"+uuid).index();
    //Remove tab
    $("#tab"+uuid).remove();
    //Remove Content
    $("#content"+uuid).remove();

    //TODO:Activate previous tab

}

//Add new tab
function addNewTab (data) {
    //Make inactive all tabs
    $("#tabs > li").removeClass("active");
    $("#tabs-content  > div").removeClass("active");

    //Create new li element for tab
    var tabli = document.createElement("li");
    $(tabli).addClass("active");
    $("#tabs").append(tabli);

    //a element inside li
    var taba = document.createElement("a");
    var uuid = generateUUID();
    var tabId = "tab"+uuid;


    //activeTabId provides unique tabs content and encapsulates templates in tabs
    Session.set("activeTabId", tabId);
    console.log(Session.get("activeTabId"));

    //Create tab
    taba.setAttribute("data-toggle","tab");
    taba.setAttribute("id",tabId);
    taba.innerHTML = data.patientName;
    tabli.appendChild(taba);

    //Create close button
    var btnClose = document.createElement('button');
    $(btnClose).addClass("btnClose");
    btnClose.innerHTML = "x";
    btnClose.onclick = function() { // Note this is a function
        removeTab(uuid);
    };
    taba.appendChild(btnClose);

    //Create div content
    var tabContent = document.createElement("div");
    var contentId = "content"+uuid;
    tabContent.setAttribute("id",contentId);
    $(tabContent).css("background-color", "black");
    $(tabContent).addClass("tab-pane");
    $(tabContent).addClass("active");
    $("#tabs-content").append(tabContent);

    contentID = contentId;
}

function insertContent() {
    console.log('Include imageViewer template');
    //Include imageViewer template
    UI.insert( UI.render( Template.viewer ), $( '#'+contentID ).get(0) );
}

Template.worklist.events({
    'click ul#tabs>li>a': function (event){
        var tabId = $(event.target).attr("id");
        if ( tabId !== undefined ) {
            //Save activeTabId to load correct study for each tab
            Session.set("activeTabId", tabId);

            var splitTabId = tabId.split("tab");
            var contentId = "content"+splitTabId[1];

            //Make inactive all tab-pane divs
            $("#tabs-content>div").removeClass("active");
            $("#"+contentId).addClass("active");
        }
    }
});

Tracker.autorun(function () {
    var data = Session.get('openNewTabEvent');
    var content = Session.get('showContentInTab');
    if ( data ) {
        addNewTab(data);
    }

    if (content) {
        insertContent();
    }

    Session.set('openNewTabEvent', false);
    Session.set('showContentInTab', false);
});