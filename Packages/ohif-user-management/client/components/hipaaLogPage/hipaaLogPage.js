Meteor.startup(() => {
    // TODO: Configure some settings
    HipaaAuditLog.configure({
        classes: {
            input: 'form-control',
            select: 'form-control',
            ribbon: ''
        },
        highlightColor: '#006289',
        closeButton: true
    });
});