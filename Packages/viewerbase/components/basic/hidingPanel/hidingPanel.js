Template.hidingPanel.events({
    'click button#btnCollapse': function(e,template) {

        // Check hidingPanel is open or not
        var hidingPanelOpen = template.hidingPanelOpen.get();
        hidingPanelOpen = !hidingPanelOpen;
        template.hidingPanelOpen.set(hidingPanelOpen);

        // Get hidingPanel width from hidingPanelWidth reactiveVar
        var contentId = this.contentId;
        var hidingPanelElement = $("#"+contentId).find(".hidingPanel");
        var hidingPanelWidth = template.hidingPanelWidth.get();
        if(hidingPanelWidth == 0) {
            hidingPanelWidth = $(hidingPanelElement).width();
            template.hidingPanelWidth.set(parseInt(hidingPanelWidth));
        }

        $(hidingPanelElement).toggleClass("hidingPanelCollapse");

        var studyBrowserContainerElement = $("#"+contentId).find(".studyBrowserContainer");
        $(studyBrowserContainerElement).toggleClass("studyBrowserContainerCollapse");

        var btnCollapseIconElement = $("#"+contentId).find("#btnCollapseIcon");
        $(btnCollapseIconElement).toggleClass("btnCollapseIcon-collapse");

        // Set viewportAndLesionTable width according to hiding panel status
        if (hidingPanelOpen) {
            var viewportAndLesionTableElement = $("#"+contentId).find("#viewportAndLesionTable");
            var viewportAndLesionTableElementWidth = $(viewportAndLesionTableElement).width();
            $(viewportAndLesionTableElement).width(viewportAndLesionTableElementWidth - hidingPanelWidth +"px");

        } else {
            var viewportAndLesionTableElement = $("#"+contentId).find("#viewportAndLesionTable");
            var viewportAndLesionTableElementWidth = $(viewportAndLesionTableElement).width();
            $(viewportAndLesionTableElement).width(viewportAndLesionTableElementWidth + hidingPanelWidth +"px");
        }


    }
});

Template.hidingPanel.onCreated(function() {
    this.hidingPanelOpen =  new ReactiveVar(true);
    this.hidingPanelWidth = new ReactiveVar(0);
});