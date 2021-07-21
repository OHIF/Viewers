# Add a Tool to the Viewer

To add a tool to the Viewer there are a few steps:

1. Add the tool itself to the repository.

  If you're using something from Cornerstone Tools you can skip this step.

  Some examples of custom tools can be found in the lesion tracker:   https://github.com/OHIF/Viewers/tree/master/Packages/ohif-lesiontracker/client/compatibility

2. Add the toolbar button itself to the array of tools in the Toolbar:
  https://github.com/OHIF/Viewers/blob/574a6d02b090b8b2f020430c5919f8377b8316c6/OHIFViewer/client/components/toolbarSection/toolbarSection.js

3. **A:** Add it to the toolManager (if it's a tool, such as length / angle):

  https://github.com/OHIF/Viewers/blob/574a6d02b090b8b2f020430c5919f8377b8316c6/Packages/lesiontracker/client/tools.js#L2

  ** --- OR --- **

  **B:** Add it to the functionList if it's a command (e.g. toggle CINE play, or Invert the current viewport):

  https://github.com/OHIF/Viewers/blob/574a6d02b090b8b2f020430c5919f8377b8316c6/OHIFViewer/client/components/viewer/viewer.js#L12
