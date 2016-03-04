(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';
    var unToolInterface = cornerstoneTools.crunexTool('unTool');
    cornerstoneTools.unTool = unToolInterface.crunex;
    cornerstoneTools.unTool.setConfiguration(unToolInterface.defaultConfiguration);
    cornerstoneTools.unToolTouch = unToolInterface.crunexTouch;

})($, cornerstone, cornerstoneMath, cornerstoneTools);
