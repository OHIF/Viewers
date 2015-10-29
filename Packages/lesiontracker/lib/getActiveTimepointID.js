getActiveTimepointID = function (viewportElement) {
    var contentId = Session.get("activeContentId");
    var imageViewportElements = $("#"+contentId).find(".imageViewerViewport");
    var index = $(imageViewportElements).index(viewportElement);

    return contentId.toString() + index.toString();
};