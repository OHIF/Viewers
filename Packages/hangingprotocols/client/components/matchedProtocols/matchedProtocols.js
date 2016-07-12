import { OHIF } from 'meteor/ohif:core';

Template.matchedProtocols.onRendered(function() {
    $('#matchedProtocols button').tooltip(OHIF.viewer.tooltipConfig);
});

Template.matchedProtocols.helpers({
    /**
     * Reactively re-render the MatchedProtocols Collection contents
     */
    matchedProtocols: function() {
        return MatchedProtocols.find();
    }
});

Template.matchedProtocols.events({
    /**
     * Instruct the ProtocolEngine to apply the specified Hanging Protocol
     */
    'click .matchedProtocol': function() {
        var protocol = this;
        ProtocolEngine.setHangingProtocol(protocol);
    },
    /**
     * Show/hide the Protocol Editor sidebar
     */
    'click #toggleProtocolEditor': function() {
        // Select the Protocol Editor DOM element
        var editor = $('#protocolEditor');

        // Modulate the main viewer width in response to the sidebar being open

        // This code is commented out so that the protocol editor is an overlay, rather than a sidebar
        // This is something that is debatable at the moment, so I am not removing the code just yet
        //
        /* if (editor.hasClass('cbp-spmenu-open')) {
            // Set the Viewer widths to reflect a hidden Protocol Editor
            $('.viewerMain').width('calc(100% - 120px)');
            $('.navbar').width('100%');
        } else {
            // Set the Viewer widths to reflect an open Protocol Editor
            $('.viewerMain').width('calc(100% - 120px - 450px)');
            $('.navbar').width('calc(100% - 450px)');
        }*/

        // Toggle a class reflect whether or not the Protocol Editor is displayed
        editor.toggleClass('cbp-spmenu-open');

        // Fire the resize handler after a short delay so that the animation can complete
        setTimeout(handleResize, 150);
    }
});
