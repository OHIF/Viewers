export default function getViewportComponent(
  { displaySet: segDisplaySet, studies },
  viewportIndex,
  availablePlugins,
  children
) {
  debugger;

  pluginName = pluginName || defaultPluginName;
  // Get a cornerstone viewport
  const ViewportComponent = availablePlugins[cornerstone];

  // TODO: Find the referenced displaySet

  let referencedDisplaySet;

  // TODO: Load the derivedDisplaySet

  segDisplaySet.load(referencedDisplaySet, studies);
  // TODO: and set it active.

  const viewportData = {
    displaySet: referencedDisplaySet,
    studies,
  };

  // TODO -> Do we need to update what displaySet is seen as hung in the viewport grid (for context specific stuff)?
  return (
    <ViewportComponent
      viewportData={viewportData}
      viewportIndex={viewportIndex}
      children={[children]}
    />
  );
}
