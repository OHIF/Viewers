import OHIF from 'ohif-core';

export default class ExtensionManager {
    static registerExtensions(store, extensions) {
        extensions.forEach(extension => {
            ExtensionManager.registerExtension(store, extension);
        })
    }

    static registerExtension(store, extension) {
        /** TODO: Use this function for checking extensions defintion and throw errors early if format is not conformant, required stuff is missing */
        let viewportModuleDefinition = extension.getViewportModuleDefinition();
        let sopClassHandlerDefinition = extension.getViewportModuleDefinition();
        if(viewportModuleDefinition) {
            store.dispatch(OHIF.redux.actions.addPlugin(viewportModuleDefinition));
        }
        if(sopClassHandlerDefinition) {
            store.dispatch(OHIF.redux.actions.addPlugin(sopClassHandlerDefinition));
        }
        //TODO: Add panels, toolbar
    }
}
