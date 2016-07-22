import { OHIF } from 'meteor/ohif:core';

Template.matchedProtocols.onRendered(() => {
    const instance = Template.instance();
    instance.$('#matchedProtocols button').tooltip(OHIF.viewer.tooltipConfig);
});

Template.matchedProtocols.helpers({
    /**
     * Reactively re-render the MatchedProtocols Collection contents
     */
    matchedProtocols() {
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
    }
});
