// @deprecated because this requires core knowledge of what modules have
// associated types.  The recommended way to do this is to add
// a `moduleType: 'myserviceNameModule'` to the service REGISTRATION object.
export default {
  COMMANDS: 'commandsModule',
  CUSTOMIZATION: 'customizationModule',
  STATE_SYNC: 'stateSyncModule',
  DATA_SOURCE: 'dataSourcesModule',
  PANEL: 'panelModule',
  SOP_CLASS_HANDLER: 'sopClassHandlerModule',
  TOOLBAR: 'toolbarModule',
  VIEWPORT: 'viewportModule',
  CONTEXT: 'contextModule',
  LAYOUT_TEMPLATE: 'layoutTemplateModule',
  HANGING_PROTOCOL: 'hangingProtocolModule',
  UTILITY: 'utilityModule',
};
