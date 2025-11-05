/**
 * XNAT-specific integration utilities
 * Extracted from PanelStudyBrowser.tsx
 */

/**
 * Processes XNAT API responses to extract series metadata
 * @param {MessageEvent} event - Window message event
 * @param {Function} setXnatSeriesMetadata - State setter for XNAT series metadata
 */
export function processXNATResponse(event: MessageEvent, setXnatSeriesMetadata: Function) {
    try {
        if (typeof event.data !== 'string') return;

        // Try to parse response as JSON
        const data = JSON.parse(event.data);

        // Check if this looks like an XNAT response
        if (data.transactionId && data.transactionId.startsWith('XNAT_') && Array.isArray(data.studies)) {

            // Process each study in the response
            data.studies.forEach(study => {
                if (Array.isArray(study.series)) {
                    const seriesMap = {};

                    // Extract series metadata
                    study.series.forEach(series => {
                        if (series.SeriesInstanceUID) {
                            seriesMap[series.SeriesInstanceUID] = {
                                SeriesDescription: series.SeriesDescription,
                                SeriesNumber: series.SeriesNumber,
                                Modality: series.Modality,
                                SeriesDate: series.SeriesDate,
                                SeriesTime: series.SeriesTime
                            };

                            // Also store any instance metadata if available
                            if (Array.isArray(series.instances) && series.instances.length > 0) {
                                const instance = series.instances[0];
                                if (instance.metadata) {
                                    seriesMap[series.SeriesInstanceUID].instanceMetadata = instance.metadata;
                                }
                            }
                        }
                    });

                    // Update the series metadata state
                    if (Object.keys(seriesMap).length > 0) {
                        setXnatSeriesMetadata(prevState => ({
                            ...prevState,
                            ...seriesMap
                        }));
                    }
                }
            });
        }
    } catch (error) {
        // Ignore parsing errors, not all messages will be valid JSON
    }
}

/**
 * Extracts series metadata from the dataSource
 * @param {Array} StudyInstanceUIDs - Array of study instance UIDs
 * @param {Object} dataSource - The data source object
 * @param {Function} setXnatSeriesMetadata - State setter for XNAT series metadata
 */
export async function extractSeriesMetadataFromDataSource(
    StudyInstanceUIDs: string[],
    dataSource: any,
    setXnatSeriesMetadata: Function
) {
    if (!dataSource || !StudyInstanceUIDs || StudyInstanceUIDs.length === 0) return;

    try {
        // Try to access the raw data in the dataSource if available
        if (typeof dataSource.getRawStudyData === 'function') {
            for (const studyUID of StudyInstanceUIDs) {
                const rawData = await dataSource.getRawStudyData(studyUID);
                if (rawData) {
                    // Check for series data in different possible formats
                    const seriesData =
                        rawData.series ||
                        (rawData.studies && rawData.studies[0] && rawData.studies[0].series) ||
                        [];

                    if (Array.isArray(seriesData) && seriesData.length > 0) {
                        const seriesMap = {};

                        seriesData.forEach(series => {
                            if (series.SeriesInstanceUID) {
                                seriesMap[series.SeriesInstanceUID] = {
                                    SeriesDescription: series.SeriesDescription,
                                    SeriesNumber: series.SeriesNumber,
                                    Modality: series.Modality
                                };
                            }
                        });

                        // Update the state with the new metadata
                        if (Object.keys(seriesMap).length > 0) {
                            setXnatSeriesMetadata(prevState => ({
                                ...prevState,
                                ...seriesMap
                            }));
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('XNAT: Error extracting series metadata from dataSource:', error);
    }
}

/**
 * Fetches XNAT series metadata from various sources
 * @param {Array} StudyInstanceUIDs - Array of study instance UIDs
 * @param {Object} dataSource - The data source object
 * @param {Function} setXnatSeriesMetadata - State setter for XNAT series metadata
 * @param {Function} extractSeriesMetadataFromDataSource - Function to extract metadata from dataSource
 */
export async function fetchXNATSeriesMetadata(
    StudyInstanceUIDs: string[],
    dataSource: any,
    setXnatSeriesMetadata: Function,
    extractSeriesMetadataFromDataSource: Function
) {
    if (!StudyInstanceUIDs || StudyInstanceUIDs.length === 0) {
        return;
    }

    try {
        // Try our data source extraction function first
        await extractSeriesMetadataFromDataSource(StudyInstanceUIDs, dataSource, setXnatSeriesMetadata);

        // Check if dataSource has the getSeriesMetadata method
        if (dataSource && typeof dataSource.getSeriesMetadata === 'function') {
            // Call dataSource method to get metadata for each study
            for (const studyUID of StudyInstanceUIDs) {
                const metadata = await dataSource.getSeriesMetadata(studyUID);
                if (metadata && Array.isArray(metadata.series)) {
                    const seriesMap = {};

                    // Map series by SeriesInstanceUID
                    metadata.series.forEach(series => {
                        if (series.SeriesInstanceUID) {
                            seriesMap[series.SeriesInstanceUID] = series;
                        }
                    });

                    // Update the state with the new metadata
                    setXnatSeriesMetadata(prevState => ({
                        ...prevState,
                        ...seriesMap
                    }));
                }
            }
        } else if (dataSource && dataSource.query && typeof dataSource.query.series?.search === 'function') {
            // Alternative approach using the search API
            for (const studyUID of StudyInstanceUIDs) {
                const series = await dataSource.query.series.search({
                    studyInstanceUid: studyUID
                });

                if (series && Array.isArray(series)) {
                    const seriesMap = {};

                    // Map series by SeriesInstanceUID
                    series.forEach(s => {
                        if (s.SeriesInstanceUID) {
                            seriesMap[s.SeriesInstanceUID] = s;
                        }
                    });

                    // Update the state with the new metadata
                    setXnatSeriesMetadata(prevState => ({
                        ...prevState,
                        ...seriesMap
                    }));
                }
            }
        }
    } catch (error) {
        console.error('XNAT: Error fetching series metadata:', error);
    }
}

/**
 * Sets up XNAT message event listener
 * @param {Function} setXnatSeriesMetadata - State setter for XNAT series metadata
 * @returns {Function} - Cleanup function to remove the event listener
 */
export function setupXNATMessageListener(setXnatSeriesMetadata: Function): () => void {
    const handleMessage = (event: MessageEvent) => {
        processXNATResponse(event, setXnatSeriesMetadata);
    };

    window.addEventListener('message', handleMessage);

    // Return cleanup function
    return () => {
        window.removeEventListener('message', handleMessage);
    };
}
