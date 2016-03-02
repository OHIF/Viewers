(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';
    var crToolInterface = cornerstoneTools.crunexTool('crTool', 'CR');
    cornerstoneTools.crTool = crToolInterface.crunex;
    cornerstoneTools.crTool.setConfiguration(crToolInterface.defaultConfiguration);
    cornerstoneTools.crToolTouch = crToolInterface.crunexTouch;


})($, cornerstone, cornerstoneMath, cornerstoneTools);
