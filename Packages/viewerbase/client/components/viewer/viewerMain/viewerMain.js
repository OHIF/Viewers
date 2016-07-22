Template.viewerMain.onRendered(function() {
    var instance = this;
    var studies = instance.data.studies;

    var parentElement = instance.$("#layoutManagerTarget").get(0);
    window.layoutManager = new LayoutManager(parentElement, studies);

    ProtocolEngine = new HP.ProtocolEngine(window.layoutManager, studies);
    HP.setEngine(ProtocolEngine);
});