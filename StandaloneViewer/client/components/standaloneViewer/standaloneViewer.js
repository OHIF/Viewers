// Define the ViewerData global object
// If there is currently any Session data for this object,
// use this to repopulate the variable
Template.standaloneViewer.onCreated(() => {
    ViewerData = Session.get('ViewerData') || {};
});