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

        var mainElements = $('#viewportAndLesionTable');
        if (isPinned) {
            // Calculate newWidth of viewportAndLesionTable
            var viewerWidth = $('#viewer').width();
            var newWidth = 100 - 122 / viewerWidth * 100;
            mainElements.css('width', newWidth + '%');
        } else {
            // Calculate newWidth of viewportAndLesionTable
            mainElements.css('width', '99%');
        }

        resizeViewportElements();
    }
});

Template.hidingPanel.helpers({
    studyDateIsShown: function() {
        return true;
    },
    isPinned: function() {
        return Template.instance().isPinned.get();
    }
});

Template.hidingPanel.onCreated(function() {
    this.panelOpen = new ReactiveVar(false);
    this.isPinned = new ReactiveVar(false);
});
