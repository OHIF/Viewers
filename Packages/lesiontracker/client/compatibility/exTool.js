(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';
    var exToolInterface = cornerstoneTools.crunexTool('exTool');
    cornerstoneTools.exTool = exToolInterface.crunex;
    cornerstoneTools.exTool.setConfiguration(exToolInterface.defaultConfiguration);
    cornerstoneTools.exToolTouch = exToolInterface.crunexTouch;

})($, cornerstone, cornerstoneMath, cornerstoneTools);
