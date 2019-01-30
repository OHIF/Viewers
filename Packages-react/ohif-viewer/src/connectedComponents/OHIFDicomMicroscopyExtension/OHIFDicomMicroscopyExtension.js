import DicomMicroscopyViewport from "./DicomMicroscopyViewport.js";
import DicomMicroscopySopClassHandler from "./DicomMicroscopySopClassHandler.js";

export default class OHIFDicomMicroscopyExtension {

    registerModules(store, addPluginActionCreator) {
        store.dispatch(addPluginActionCreator({
            id: 'microscopy',
            type: 'viewport',
            component: DicomMicroscopyViewport
        }));
        store.dispatch(addPluginActionCreator({
            id: 'microscopy_sopClassHandler',
            type: 'sopClassHandler',
            component: DicomMicroscopySopClassHandler
        }));
    }

}