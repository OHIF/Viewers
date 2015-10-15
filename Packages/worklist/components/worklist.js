Template.worklist.helpers({
    'tabs': function() {
        var tabData = tabs.find().fetch();
        return tabData;
    },
});

Template.worklist.events({
    'click a[data-toggle="tab"]': function(e) {
        console.log(e.currentTarget);
        var contentId = $(e.currentTarget).data('target');
        $(e.currentTarget).tab('show');

        var container = $('.tab-content').find(contentId).get(0);
        var studies = Session.get('StudiesInTab' + contentId);
        var data = {
            studies: studies
        };

        if (contentId === '#worklistTab') {
            console.log('Switching to worklist');
            $("#viewer").remove();
            document.body.style.overflow = null;
            document.body.style.height = null;
            document.body.style.minWidth = null;
            document.body.style.position = null;
        } else {
            UI.renderWithData(Template.viewer, data, container);
            var imageViewer = $("#viewer");
            if (imageViewer) {
                $('.navbar-default').css({
                    'background-color': '#000000',
                    'border-color': '#101010'
                });
                document.body.style.overflow = "hidden";
                document.body.style.height = '100%';
                document.body.style.width = '100%';
                document.body.style.minWidth = 0;
                document.body.style.position = 'fixed'; // Prevent overscroll on mobile devices
            }
        }
    }
});