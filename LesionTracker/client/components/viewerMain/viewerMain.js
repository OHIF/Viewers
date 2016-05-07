Template.viewerMain.helpers({
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
            id: 'wwwc',
            title: 'WW/WC',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-sun-o'
        });

        buttonData.push({
            id: 'zoom',
            title: 'Zoom',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-search'
        });

        buttonData.push({
            id: 'pan',
            title: 'Pan',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-arrows'
        });

        buttonData.push({
            id: 'stackScroll',
            title: 'Stack Scroll',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-bars'
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
            title: 'Target Tool',
            classes: 'imageViewerTool',
            iconClasses: 'fa fa-arrows-alt'
        });

        buttonData.push({
            id: 'nonTarget',
            title: 'Non-Target Tool',
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

Template.viewerMain.onRendered(function() {
    var parentNode = document.getElementById('layoutManagerTarget');
    var studies = this.data.studies;
    layoutManager = new LayoutManager(parentNode, studies);

    ProtocolEngine = new HP.ProtocolEngine(layoutManager, studies);
    HP.setEngine(ProtocolEngine);
});
