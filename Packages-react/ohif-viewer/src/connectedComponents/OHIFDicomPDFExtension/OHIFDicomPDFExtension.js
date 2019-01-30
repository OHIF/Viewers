import OHIFDicomPDFViewport from "./OHIFDicomPDFViewport.js";
import OHIFDicomPDFSopClassHandler from "./OHIFDicomPDFSopClassHandler.js";

export default class OHIFDicomPDFExtension {

    registerModules(store, addPluginActioNCreator) {
        store.dispatch(addPluginActioNCreator({
            id: 'pdf',
            type: 'viewport',
            component: OHIFDicomPDFViewport
        }));
          
        store.dispatch(addPluginActioNCreator({
            id: 'pdf_sopClassHandler',
            type: 'sopClassHandler',
            component: OHIFDicomPDFSopClassHandler
        }));
    }

}
