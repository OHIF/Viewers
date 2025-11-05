/**
 * Thumbnail management utilities
 * Extracted from PanelStudyBrowser.tsx
 */

/**
 * Loads initial thumbnails for display sets
 * @param {boolean} hasLoadedViewports - Whether viewports have loaded
 * @param {string} activeViewportId - Active viewport ID
 * @param {Array} StudyInstanceUIDs - Study instance UIDs
 * @param {Object} displaySetService - Display set service
 * @param {Object} dataSource - Data source
 * @param {Function} getImageSrc - Function to get image source
 * @param {Function} setThumbnailImageSrcMap - State setter for thumbnail map
 * @param {Function} setHasLoadedViewports - State setter for loaded viewports flag
 */
export async function loadInitialThumbnails(
    hasLoadedViewports: boolean,
    activeViewportId: string,
    StudyInstanceUIDs: string[],
    displaySetService: any,
    dataSource: any,
    getImageSrc: Function,
    setThumbnailImageSrcMap: Function,
    setHasLoadedViewports: Function
) {
    if (!hasLoadedViewports) {
        if (activeViewportId) {
            // Once there is an active viewport id, it means the layout is ready
            // so wait a bit of time to allow the viewports preferential loading
            // which improves user experience of responsiveness significantly on slower
            // systems.
            window.setTimeout(() => setHasLoadedViewports(true), 250);
        }

        return;
    }

    const currentDisplaySets = displaySetService.activeDisplaySets;
    currentDisplaySets.forEach(async dSet => {
        const newImageSrcEntry = {};
        const displaySet = displaySetService.getDisplaySetByUID(dSet.displaySetInstanceUID);

        // Check if dataSource has getImageIdsForDisplaySet method
        let imageIds = [];
        if (dataSource && typeof dataSource.getImageIdsForDisplaySet === 'function') {
            imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
        } else {
            console.warn('XNAT: dataSource.getImageIdsForDisplaySet is not a function');
        }

        const imageId = imageIds && imageIds.length > 0 ? imageIds[Math.floor(imageIds.length / 2)] : null;

        // TODO: Is it okay that imageIds are not returned here for SR displaySets?
        if (!imageId || displaySet?.unsupported) {
            return;
        }

        // When the image arrives, render it and store the result in the thumbnailImgSrcMap
        try {
            if (typeof getImageSrc === 'function') {
                newImageSrcEntry[dSet.displaySetInstanceUID] = await getImageSrc(imageId);
            } else {
                console.warn('XNAT: getImageSrc is not a function');
                newImageSrcEntry[dSet.displaySetInstanceUID] = '';
            }

            setThumbnailImageSrcMap(prevState => {
                return { ...prevState, ...newImageSrcEntry };
            });
        } catch (error) {
            console.error('XNAT: Error loading image for thumbnail', error);
        }
    });
}

/**
 * Loads thumbnails for newly added display sets
 * @param {Object} data - Display sets added data
 * @param {Function} getImageSrc - Function to get image source
 * @param {Object} dataSource - Data source
 * @param {Object} displaySetService - Display set service
 * @param {Function} setThumbnailImageSrcMap - State setter for thumbnail map
 */
export async function loadThumbnailsForAddedDisplaySets(
    data: any,
    getImageSrc: Function,
    dataSource: any,
    displaySetService: any,
    setThumbnailImageSrcMap: Function
) {
    const { displaySetsAdded } = data;

    displaySetsAdded.forEach(async dSet => {
        const newImageSrcEntry = {};
        const displaySet = displaySetService.getDisplaySetByUID(dSet.displaySetInstanceUID);

        if (displaySet?.unsupported) {
            return;
        }

        // Ensure StudyInstanceUID is set on the display set
        if (!displaySet.StudyInstanceUID && sessionStorage.getItem('xnat_studyInstanceUID')) {
            displaySet.StudyInstanceUID = sessionStorage.getItem('xnat_studyInstanceUID');
        }

        // Check if dataSource has getImageIdsForDisplaySet method
        let imageIds = [];
        if (dataSource && typeof dataSource.getImageIdsForDisplaySet === 'function') {
            imageIds = dataSource.getImageIdsForDisplaySet(displaySet);
        } else {
            console.warn('XNAT: dataSource.getImageIdsForDisplaySet is not a function');
        }

        // If no imageIds, try another approach or skip
        if (!imageIds || imageIds.length === 0) {
            return;
        }

        const imageId = imageIds[Math.floor(imageIds.length / 2)];

        // TODO: Is it okay that imageIds are not returned here for SR displaySets?
        if (!imageId) {
            return;
        }

        // When the image arrives, render it and store the result in the thumbnailImgSrcMap
        try {
            if (typeof getImageSrc === 'function') {
                newImageSrcEntry[dSet.displaySetInstanceUID] = await getImageSrc(
                    imageId,
                    dSet.initialViewport
                );
            } else {
                console.warn('XNAT: getImageSrc is not a function');
                newImageSrcEntry[dSet.displaySetInstanceUID] = '';
            }

            setThumbnailImageSrcMap(prevState => {
                return { ...prevState, ...newImageSrcEntry };
            });
        } catch (error) {
            console.error('XNAT: Error loading image for thumbnail', error);
        }
    });
}

/**
 * Sets up thumbnail loading for display set changes
 * @param {Array} changedDisplaySets - Changed display sets
 * @param {Object} thumbnailImageSrcMap - Current thumbnail map
 * @param {Object} xnatSeriesMetadata - XNAT series metadata
 * @param {Function} setDisplaySets - State setter for display sets
 * @param {Function} _mapDisplaySets - Function to map display sets
 */
export function handleDisplaySetChanges(
    changedDisplaySets: any[],
    thumbnailImageSrcMap: any,
    xnatSeriesMetadata: any,
    setDisplaySets: Function,
    _mapDisplaySets: Function
) {
    const mappedDisplaySets = _mapDisplaySets(changedDisplaySets, thumbnailImageSrcMap, xnatSeriesMetadata);
    setDisplaySets(mappedDisplaySets);
}

/**
 * Handles display set metadata invalidation
 * @param {Object} displaySetService - Display set service
 * @param {Object} thumbnailImageSrcMap - Current thumbnail map
 * @param {Object} xnatSeriesMetadata - XNAT series metadata
 * @param {Function} setDisplaySets - State setter for display sets
 * @param {Function} _mapDisplaySets - Function to map display sets
 */
export function handleDisplaySetMetadataInvalidation(
    displaySetService: any,
    thumbnailImageSrcMap: any,
    xnatSeriesMetadata: any,
    setDisplaySets: Function,
    _mapDisplaySets: Function
) {
    const mappedDisplaySets = _mapDisplaySets(
        displaySetService.getActiveDisplaySets(),
        thumbnailImageSrcMap,
        xnatSeriesMetadata
    );

    setDisplaySets(mappedDisplaySets);
}
