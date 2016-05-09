Template.toolbarSection.onRendered(function() {
    var instance = this;

    instance.state = instance.data.state;
});

Template.toolbarSection.helpers({
    toolbarOptions: function() {
        var toolbarOptions = {};

        var buttonData = [];

        var btnGroup = [];

        buttonData.push({
            id: 'resetViewport',
            title: 'Reset Viewport',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-undo'
        });

        buttonData.push({
            id: 'zoom',
            title: 'Zoom',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-search'
        });

        buttonData.push({
            id: 'wwwc',
            title: 'Levels',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-sun-o'
        });

        buttonData.push({
            id: 'pan',
            title: 'Pan',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-arrows'
        });

        buttonData.push({
            id: 'length',
            title: 'Length Measurement',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-arrows-v'
        });

        buttonData.push({
            id: 'ellipticalRoi',
            title: 'Elliptical ROI Measurement',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-circle-o'
        });

        buttonData.push({
            id: 'bidirectional',
            title: 'Target',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-arrows-alt'
        });

        buttonData.push({
            id: 'nonTarget',
            title: 'Non-Target',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-long-arrow-up'
        });

        buttonData.push({
            id: 'clearTools',
            title: 'Clear tools',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-trash'
        });

        buttonData.push({
            id: 'toggleLesionTrackerTools',
            title: 'Show / hide tools',
            classes: 'imageViewerCommand',
            iconClasses: 'fa fa-eye'
        });

        // CR/UN/EX Tools
        var crunexToolsBtns = {
            id: 'crunexTools',
            tools: [{
                id: 'crTool',
                title: 'CR Tool',
                classes: 'imageViewerTool',
                iconClasses: 'fa fa-cr'
            }, {
                id: 'unTool',
                title: 'UN Tool',
                classes: 'imageViewerTool',
                iconClasses: 'fa fa-un'
            }, {
                id: 'exTool',
                title: 'EX Tool',
                classes: 'imageViewerTool',
                iconClasses: 'fa fa-ex'
            }],
            title: 'CR/UN/EX',
            groupIcon: 'fa fa-exchange'
        };

        btnGroup.push(crunexToolsBtns);

        toolbarOptions.buttonData = buttonData;
        toolbarOptions.includePlayClipButton = false;
        toolbarOptions.includeLayoutButton = false;
        toolbarOptions.includeHangingProtocolButtons = false;
        toolbarOptions.btnGroup = btnGroup;
        return toolbarOptions;
    }
});

Template.toolbarSection.events({
    'click #studySidebarToggle': function(event, instance) {
        var isOpen = instance.data.state.get('studySidebarOpen');
        instance.data.state.set('studySidebarOpen', !isOpen);
    },
    'click #lesionSidebarToggle': function(event, instance) {
        var isOpen = instance.data.state.get('lesionSidebarOpen');
        instance.data.state.set('lesionSidebarOpen', !isOpen);
    }
});