import OHIFDicomPDFViewport from "./OHIFDicomPDFViewport.js";
import OHIFDicomPDFSopClassHandler from "./OHIFDicomPDFSopClassHandler.js";

export default class OHIFDicomPDFExtension {
    getViewportModuleDefinition() {
        return {
            id: 'pdf',
            type: 'viewport',
            component: OHIFDicomPDFViewport
        };
    }

    getSopHandlerModuleDefinition() {
        return {
            id: 'pdf_sopClassHandler',
            type: 'sopClassHandler',
            component: OHIFDicomPDFSopClassHandler
        }
    }

    getPanelModuleDefinition() {
        return null;
    }

    getToolbarModuleDefinition() {
        return null;
    }

}
