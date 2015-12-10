Template.hidingPanel.events({
    'mouseover div.hidingPanel': function(e, template) {

        if (!template.panelPinned.get()) {

            var hidingPanel = $(e.currentTarget);
            hidingPanel.css({
                width: "120px"
            });

            // Set panel as open
            template.hidingPanelOpen.set(true);

            // Rotate Arrow Icon
            $('.arrowIcon').toggleClass("arrowIconRotate");

            // Set panel content opacity
            $(".hidingPanelContent").toggleClass("hidingPanelContentOpaque");
        }
    },

    'mouseout div.hidingPanel': function(e, template) {

        if (!template.panelPinned.get()) {
            var hidingPanel = $(e.currentTarget);
            hidingPanel.css({
                width: "1%"
            });

            // Set panel as closed
            template.hidingPanelOpen.set(false);

            // Rotate Arrow Icon
            $('.arrowIcon').toggleClass("arrowIconRotate");

            // Set panel content opacity
            $(".hidingPanelContent").toggleClass("hidingPanelContentOpaque");

        }
    },

    'click button.btnPin': function(e, template) {
        var panelPinned = template.panelPinned.get();
        panelPinned = !panelPinned;
        template.panelPinned.set(panelPinned);
        if(panelPinned) {
            // Calculate newWidth of viewportAndLesionTable
            var viewerWidth = $("#viewer").width();
            var newPercentageOfviewportAndLesionTable = 100 - 120 / viewerWidth *100;
            $("#viewportAndLesionTable").css("width", newPercentageOfviewportAndLesionTable+"%");

            resizeViewportElements();
        }else{

            // Calculate newWidth of viewportAndLesionTable
            $("#viewportAndLesionTable").css("width", "99%");

            resizeViewportElements();
        }
    }
});

Template.hidingPanel.helpers({
    'studyDateIsShown': function() {
        return true;
    },
    'panelPinned': function() {
        return Template.instance().panelPinned.get();
    },
    'hidingPanelOpen': function() {
        return Template.instance().hidingPanelOpen.get();
    }
});

Template.hidingPanel.onCreated(function() {
    this.hidingPanelOpen =  new ReactiveVar(false);
    this.panelPinned = new ReactiveVar(false);
});