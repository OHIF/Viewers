const EVENTS = {
  DISPLAY_SETS_ADDED: 'event::displaySetService:displaySetsAdded',
  DISPLAY_SETS_CHANGED: 'event::displaySetService:displaySetsChanged',
  DISPLAY_SETS_REMOVED: 'event::displaySetService:displaySetsRemoved',
  DISPLAY_SET_SERIES_METADATA_INVALIDATED:
    'event::displaySetService:displaySetSeriesMetadataInvalidated',
  // The thumbnail tray order changed; the active display sets did not change.
  DISPLAY_SET_ORDER_CHANGED: 'event::displaySetService:displaySetOrderChanged',
};

export default EVENTS;
