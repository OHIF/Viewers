/**
 * Display set management utilities
 * Extracted from PanelStudyBrowser.tsx
 */

import { utils } from '@ohif/core';
const { sortStudyInstances } = utils;
import { _mapDisplaySets } from './DataMappers';

/**
 * Manages display sets state and updates
 * @param {Array} StudyInstanceUIDs - Study instance UIDs
 * @param {Object} thumbnailImageSrcMap - Thumbnail image source map
 * @param {Object} displaySetService - Display set service
 * @param {Object} xnatSeriesMetadata - XNAT series metadata
 * @param {Function} setDisplaySets - State setter for display sets
 */
export function updateDisplaySets(
    StudyInstanceUIDs: string[],
    thumbnailImageSrcMap: any,
    displaySetService: any,
    xnatSeriesMetadata: any,
    setDisplaySets: Function
) {
    // TODO: Are we sure `activeDisplaySets` will always be accurate?
    const currentDisplaySets = displaySetService.activeDisplaySets;
    const mappedDisplaySets = _mapDisplaySets(currentDisplaySets, thumbnailImageSrcMap, xnatSeriesMetadata);
    sortStudyInstances(mappedDisplaySets);

    setDisplaySets(mappedDisplaySets);
}

/**
 * Sets up display set event subscriptions
 * @param {Object} displaySetService - Display set service
 * @param {Function} getImageSrc - Function to get image source
 * @param {Object} dataSource - Data source
 * @param {Function} setThumbnailImageSrcMap - State setter for thumbnail map
 * @param {Function} setDisplaySets - State setter for display sets
 * @param {Object} thumbnailImageSrcMap - Current thumbnail map
 * @param {Object} xnatSeriesMetadata - XNAT series metadata
 * @param {Function} _mapDisplaySets - Function to map display sets
 * @param {Array} StudyInstanceUIDs - Study instance UIDs
 * @returns {Array} - Cleanup functions for unsubscribing
 */
export function setupDisplaySetSubscriptions(
    displaySetService: any,
    getImageSrc: Function,
    dataSource: any,
    setThumbnailImageSrcMap: Function,
    setDisplaySets: Function,
    thumbnailImageSrcMap: any,
    xnatSeriesMetadata: any,
    _mapDisplaySets: Function,
    StudyInstanceUIDs: string[]
) {
    // DISPLAY_SETS_ADDED returns an array of DisplaySets that were added
    const SubscriptionDisplaySetsAdded = displaySetService.subscribe(
        displaySetService.EVENTS.DISPLAY_SETS_ADDED,
        data => {
            loadThumbnailsForAddedDisplaySets(
                data,
                getImageSrc,
                dataSource,
                displaySetService,
                setThumbnailImageSrcMap
            );
        }
    );

    // DISPLAY_SETS_CHANGED returns `DisplaySerService.activeDisplaySets`
    const SubscriptionDisplaySetsChanged = displaySetService.subscribe(
        displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
        changedDisplaySets => {
            handleDisplaySetChanges(
                changedDisplaySets,
                thumbnailImageSrcMap,
                xnatSeriesMetadata,
                setDisplaySets,
                _mapDisplaySets
            );
        }
    );

    const SubscriptionDisplaySetMetaDataInvalidated = displaySetService.subscribe(
        displaySetService.EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED,
        () => {
            handleDisplaySetMetadataInvalidation(
                displaySetService,
                thumbnailImageSrcMap,
                xnatSeriesMetadata,
                setDisplaySets,
                _mapDisplaySets
            );
        }
    );

    return [
        () => SubscriptionDisplaySetsAdded.unsubscribe(),
        () => SubscriptionDisplaySetsChanged.unsubscribe(),
        () => SubscriptionDisplaySetMetaDataInvalidated.unsubscribe()
    ];
}

// Import the thumbnail management functions
import {
    loadThumbnailsForAddedDisplaySets,
    handleDisplaySetChanges,
    handleDisplaySetMetadataInvalidation
} from './ThumbnailManager';
