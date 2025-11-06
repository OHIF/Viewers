/**
 * Segmentation loading and viewport management utilities
 * Extracted from segmentationCommands.ts
 */

import { Enums } from '@cornerstonejs/tools';
import { getTargetViewport } from './helpers';

export interface SegmentationLoaderParams {
    segmentationService: any;
    viewportGridService: any;
}

/**
 * Loads segmentations for a specified viewport.
 * The function prepares the viewport for rendering, then loads the segmentation details.
 * Additionally, if the segmentation has scalar data, it is set for the corresponding label map volume.
 *
 * @param params - Parameters for the function.
 * @param params.segmentations - Array of segmentations to be loaded.
 * @param params.viewportId - the target viewport ID.
 */
export async function loadSegmentationsForViewport(
    { segmentations, viewportId }: { segmentations: any[]; viewportId: string },
    { segmentationService, viewportGridService }: SegmentationLoaderParams
) {
    // Todo: handle adding more than one segmentation
    const viewport = getTargetViewport({ viewportId, viewportGridService });
    const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];

    const segmentation = segmentations[0];
    const segmentationId = segmentation.segmentationId;

    // Set active segmentation first
    await segmentationService.setActiveSegmentation(viewportId, segmentationId);

    // Create the segmentation representation
    const generatedSegmentationId = await segmentationService.createSegmentationForDisplaySet(
        displaySetInstanceUID,
        {
            segmentationId,
            label: segmentation.label || 'Segmentation',
            segments: segmentation.segments
                ? Object.fromEntries(
                    Object.entries(segmentation.segments).map(([key, segment]: [string, any]) => [
                        key,
                        {
                            segmentIndex: parseInt(key),
                            label: segment.label || `Segment ${key}`,
                            active: segment.active || key === '1',
                            locked: segment.locked || false,
                            color: segment.color,
                        },
                    ])
                )
                : {
                    1: {
                        segmentIndex: 1,
                        label: 'Segment 1',
                        active: true,
                    },
                },
        }
    );

    await segmentationService.addSegmentationRepresentation(viewportId, {
        segmentationId,
        type: Enums.SegmentationRepresentations.Labelmap,
    });

    return generatedSegmentationId;
}
