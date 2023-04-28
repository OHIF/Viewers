const ID_PREFIX = "viewport";

/** Update the viewport ids to be unique */
const uniqueViewportIds = (viewportsToUpdate, existingViewports = []) => {
  const viewportIds = new Set<string>();
  existingViewports.forEach(viewport => {
    const { viewportIndex, viewportId } = viewport;
    if (!viewportId) return;
    const found = viewportsToUpdate.find(newViewport => newViewport.viewportIndex == viewportIndex);
    if (found) {
      // Re-use the viewportID if not provided
      console.debug("Re-using viewport id", viewportIndex, viewportId);
      found.viewportOptions.viewportId ||= viewportId;
      return;
    }
    viewportIds.add(viewportId);
  });

  // Don't use just the id-prefix
  viewportIds.add(ID_PREFIX);
  viewportsToUpdate.forEach(viewport => {
    let { viewportId } = viewport.viewportOptions;
    if (!viewportId) viewportId = ID_PREFIX;
    if (viewportIds.has(viewportId)) {
      let i;
      for (i = 0; viewportIds.has(`${viewportId}-${i}`); i++) {
        if (i > 128) throw new Error(`Adding unique index too big ${i}`)
      }
      viewportId = `${viewportId}-${i}`;
    }
    viewport.viewportOptions.viewportId = viewportId;
    viewport.viewportId = viewport.id = viewportId;
    viewportIds.add(viewportId);
    console.debug("Assigning viewportId", viewport.viewportIndex, viewportId);
  });
}

export default uniqueViewportIds;
