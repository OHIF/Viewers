import { adaptersRT } from '@cornerstonejs/adapters';
import { DicomMetadataStore } from '@ohif/core';

// Helper function to get target viewport
export const getTargetViewport = ({ viewportId, viewportGridService }) => {
    const { viewports, activeViewportId } = viewportGridService.getState();
    const targetViewportId = viewportId || activeViewportId;
    return viewports.get(targetViewportId);
};

// Helper function to generate RTSS from segmentations
export const generateRTSSFromSegmentations = async (segmentations, MetadataProvider, DicomMetadataStore) => {
    return adaptersRT.Cornerstone3D.RTSS.generateRTSSFromSegmentations(segmentations, MetadataProvider, DicomMetadataStore);
};
