import DicomMicroscopyViewport from "./DicomMicroscopyViewport.js";
import DicomMicroscopySopClassHandler from "./DicomMicroscopySopClassHandler.js";

export default class OHIFDicomMicroscopyExtension {

    getViewportModuleDefinition() {
        return {
            id: 'microscopy',
            type: 'viewport',
            component: DicomMicroscopyViewport
        };
    }

    getSopHandlerModuleDefinition() {
        return {
            id: 'microscopy_sopClassHandler',
            type: 'sopClassHandler',
            component: DicomMicroscopySopClassHandler
        }
    }

    getPanelModuleDefinition() {
        return null;
    }

    getToolbarModuleDefinition() {
        return null;
    }
}