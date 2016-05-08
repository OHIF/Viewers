
function pinPanel() {
    var hidingPanel = $('.hidingPanel');
    hidingPanel.css({
        width: '122px'
    });

    hidingPanel.find('.hidingPanelContent').css({
        transform: 'translate(130px)'
    });

    // Calculate newWidth of viewportAndLesionTable
    var viewerWidth = $('#viewer').width();
    var newWidth = 100 - 122 / viewerWidth * 100;
    $('#viewportAndLesionTable').css('width', newWidth + '%');
}

function unpinPanel() {
    // Calculate newWidth of viewportAndLesionTable
    $('#viewportAndLesionTable').css('width', '99%');
}

Template.hidingPanel.events({
    'mouseover div.hidingPanel': function(e, template) {
        var isPinned = template.isPinned.get();
        if (isPinned) {
            return;
        }

        var hidingPanel = $(e.currentTarget);
        hidingPanel.css({
            width: '122px'
        });

        // Set panel as open
        template.panelOpen.set(true);

        // Rotate Arrow Icon
        $('.arrowIcon').addClass('fa-flip-horizontal');

        // Set panel content opacity
        //hidingPanel.find('.hidingPanelContent').css('opacity', '1');
        hidingPanel.find('.hidingPanelContent').css({
            transform: 'translate(130px)'
        });
    },

    'mouseout div.hidingPanel': function(e, template) {
        var isPinned = template.isPinned.get();
        if (isPinned) {
            return;
        }

        var hidingPanel = $(e.currentTarget);
        hidingPanel.css({
            width: '1%'
        });

        // Set panel as closed
        template.panelOpen.set(false);

        // Rotate Arrow Icon
        $('.arrowIcon').removeClass('fa-flip-horizontal');

        // Set panel content opacity
        //hidingPanel.find('.hidingPanelContent').css('opacity', '0');
        hidingPanel.find('.hidingPanelContent').css({
            transform: 'translate(-130px)'
        });
    },
    'click button.btnPin': function(e, template) {
        var isPinned = template.isPinned.get();
        isPinned = !isPinned;

        template.isPinned.set(isPinned);

        // Set isPanelPinned of ViewerData
        var contentId = template.data.contentId;
        ViewerData[contentId].isPanelPinned = isPinned;
        Session.set('ViewerData', ViewerData);

        if (isPinned) {
            pinPanel();
        } else {
            unpinPanel();
        }

        resizeViewportElements();
    }
});

Template.hidingPanel.helpers({
    isPinned: function() {
        return Template.instance().isPinned.get();
    }
});

Template.hidingPanel.onRendered(function() {

    var contentId = this.data.contentId;
    var isPanelPinned = ViewerData[contentId].isPanelPinned;
    if (isPanelPinned) {
        pinPanel();
    }

});

Template.hidingPanel.onCreated(function() {

    this.panelOpen = new ReactiveVar(false);

    var contentId = this.data.contentId;
    var isPanelPinned = ViewerData[contentId].isPanelPinned;
    if (!isPanelPinned) {
        isPanelPinned = false;
    }

    this.isPinned = new ReactiveVar(isPanelPinned);

});
