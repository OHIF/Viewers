import { Meteor } from 'meteor/meteor';
import { Viewerbase } from 'meteor/ohif:viewerbase';
import nonTargetTool from './compatibility/nonTargetTool.js'; 

Meteor.startup(function() {
  const thirdPartyTools = {
    nonTarget: {
      classObj: nonTargetTool,
      className: 'nonTargetTool',
      configuration: {}
    }
  }

  Object.keys(thirdPartyTools).forEach(toolName => {
    const { className, classObj, configuration } = thirdPartyTools[toolName];
    Viewerbase.toolManager.registerThirdPartyTool(
      className,
      toolName,
      classObj,
      configuration
    );
  });
});