import sessionMap from '../../sessionMap.js';
import fetchCSRFToken from '../fetchCSRFToken.js';

/**
 * JSONMeasurementExporter is a utility class for exporting Measurement Collection JSON data to XNAT.
 * It encapsulates the logic for preparing and sending the export request.
 */
class JSONMeasurementExporter {
    /**
     * Creates an instance of JSONMeasurementExporter.
     *
     * @param {Blob} blob - The Measurement Collection JSON data as a Blob.
     * @param {string} seriesInstanceUID - The UID of the series to associate the measurements with.
     * @param {string} label - The label for the ROI collection in XNAT.
     * @param {string} experimentId - The ID of the experiment (session) in XNAT.
     */
    constructor(blob, seriesInstanceUID, label, experimentId) {
        this.blob = blob;
        this.seriesInstanceUID = seriesInstanceUID;
        this.label = label;
        this.experimentId = experimentId;
    }

    /**
     * Exports the measurements to XNAT.
     * Handles CSRF token fetching and error handling.
     * @param {boolean} [overwrite=false] - Whether to overwrite an existing collection.
     * @throws {Error} If the export fails.
     */
    async exportToXNAT(overwrite = false) {
        const { seriesInstanceUID, label, experimentId, blob } = this;

        // Get the project ID from sessionMap
        const projectId = sessionMap.getProject(seriesInstanceUID);

        if (!projectId) {
            throw new Error(
                'Could not determine project ID. Measurements not exported.'
            );
        }

        // Get CSRF token
        const csrfToken = await fetchCSRFToken();

        // Build the URL for export
        const url =
            `${sessionMap.xnatRootUrl}xapi/roi/projects/${projectId}/sessions/${experimentId}/collections/${label}?type=MEAS&overwrite=${overwrite}&XNAT_CSRF=${csrfToken}`;

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.onload = () => {
                if (xhr.status === 200 || xhr.status === 201) {
                    resolve(xhr.responseText);
                } else {
                    const error = new Error(
                        `XNAT export failed with status ${xhr.status}: ${
              xhr.responseText || xhr.statusText
            }`
                    );

                    // Check if it's a "collection exists" error
                    if (
                        xhr.status === 422 ||
                        (xhr.responseText &&
                            xhr.responseText.toLowerCase().includes('roi collection exists'))
                    ) {
                        error['isCollectionExistsError'] = true;
                    }

                    reject(error);
                }
            };

            xhr.onerror = () => {
                const error = new Error('XNAT export failed due to a network error.');
                reject(error);
            };

            xhr.open('PUT', url, true);
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.send(blob);
        });
    }
}

export default JSONMeasurementExporter;