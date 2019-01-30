import OHIF from 'ohif-core';

export default class ExtensionManager {
  static registerExtensions(store, extensions) {
    extensions.forEach(extension => {
      ExtensionManager.registerExtension(store, extension);
    });
  }

  static registerExtension(store, extension) {
    /**  
     *   TODO: 
     * - Use this function for checking extensions definition and throw errors early/ignore extension if format is not conformant or any required stuff is missing
     * - Check uniqueness of extension id
     * - Id Management: SopClassHandlers currently refer to viewport module by id; setting the extension id as viewport module id is a workaround for now
     * - Add loading of panel and toolbar modules */
    let viewportModule = extension.getViewportModule();
    let sopClassHandler = extension.getSopClassHandler();
    if (viewportModule) {
      store.dispatch(OHIF.redux.actions.addPlugin({
        id: extension.getExtensionId(),
        type: 'viewport',
        component: viewportModule
      }));
    }
    if (sopClassHandler) {
      store.dispatch(OHIF.redux.actions.addPlugin({
        id: extension.getExtensionId()+"_sopClass_handler",
        type: 'sopClassHandler',
        component: sopClassHandler
      }));
    }
  }
}
