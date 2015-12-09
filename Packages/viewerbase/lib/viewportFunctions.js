getActiveViewportElement = function() {
    var viewportIndex = Session.get("activeViewport");
    return $('.imageViewerViewport').get(viewportIndex);
};

zoomIn = function() {
    var element = getActiveViewportElement();
    var viewport = cornerstone.getViewport(element);
    viewport.scale += 0.15;
    if (viewport.scale > 10.0) {
        viewport.scale = 10.0;
    }
    cornerstone.setViewport(element, viewport);
};

zoomOut = function() {
    var element = getActiveViewportElement();
    var viewport = cornerstone.getViewport(element);
    viewport.scale -= 0.15;
    if (viewport.scale < 0.05) {
        viewport.scale = 0.05;
    }
    cornerstone.setViewport(element, viewport);
};

zoomToFit = function() {
    var element = getActiveViewportElement();
    cornerstone.fitToWindow(element);
};

rotateL = function() {
    var element = getActiveViewportElement();
    var viewport = cornerstone.getViewport(element);
    viewport.rotation -= 90;
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};

rotateR = function() {
    var element = getActiveViewportElement();
    var viewport = cornerstone.getViewport(element);
    viewport.rotation += 90;
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};

invert = function() {
    var element = getActiveViewportElement();
    var viewport = cornerstone.getViewport(element);
    viewport.invert = (viewport.invert === false);
    cornerstone.setViewport(element, viewport);
};

flipV = function() {
    var element = getActiveViewportElement();
    var viewport = cornerstone.getViewport(element);
    viewport.vflip = (viewport.vflip === false);
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};

flipH = function() {
    var element = getActiveViewportElement();
    var viewport = cornerstone.getViewport(element);
    viewport.hflip = (viewport.hflip === false);
    cornerstone.setViewport(element, viewport);
    updateOrientationMarkers(element, viewport);
};