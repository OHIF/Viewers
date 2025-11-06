import { convertToAbsoluteUrl } from './Utils/DataSourceUtils';
import { log } from './constants';
import type { XNATDataSourceConfigManager } from './config';

/**
 * XNAT API methods for server communication
 */
export class XNATApi {
    private configManager: XNATDataSourceConfigManager;

    constructor(configManager: XNATDataSourceConfigManager) {
        this.configManager = configManager;
    }

    /**
     * Get experiment metadata from XNAT
     */
    async getExperimentMetadata(projectId: string, experimentId: string) {
        const currentConfig = this.configManager.getConfig();
        const apiPath = `/xapi/viewer/projects/${projectId}/experiments/${experimentId}`;

        // Dynamic server URL detection for robust deployment
        const getServerUrl = () => {
            if (typeof window !== 'undefined' && window.location) {
                const { protocol, hostname, port } = window.location;
                const portPart = port && port !== '80' && port !== '443' ? `:${port}` : '';
                return `${protocol}//${hostname}${portPart}`;
            }
            return 'http://localhost'; // Development fallback
        };

        const baseUrl = currentConfig.wadoRoot || getServerUrl();
        const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, currentConfig);
        const headers = this.configManager.getAuthorizationHeader();
        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json', ...headers },
            });

            if (!response.ok) {
                const errorText = await response.text();
                log.error(`XNAT API error fetching experiment ${experimentId}: ${response.status} ${response.statusText}. Body: ${errorText}`);
                throw new Error(`XNAT API error: ${response.status} ${response.statusText}. Body: ${errorText}`);
            }
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                log.error(`XNATDataSource: Failed to parse JSON response for ${experimentId}. URL: ${apiUrl}, Status: ${response.status}. Error:`, jsonError);
                const responseText = await response.text();
                log.error(`XNATDataSource: Raw response text for ${experimentId}: ${responseText}`);
                throw jsonError;
            }
            return data;
        } catch (fetchError) {
            log.error(`XNATDataSource: Error during fetch or processing for ${experimentId}. URL: ${apiUrl}. Error:`, fetchError);
            throw fetchError;
        }
    }

    /**
     * Get subject metadata from XNAT
     */
    async getSubjectMetadata(projectId: string, subjectId: string) {
        if (!projectId || !subjectId) {
            log.error('XNAT: Missing projectId or subjectId for metadata fetch');
            return null;
        }
        try {
            const currentConfig = this.configManager.getConfig();

            // Dynamic server URL detection for robust deployment
            const getServerUrl = () => {
                if (typeof window !== 'undefined' && window.location) {
                    const { protocol, hostname, port } = window.location;
                    const portPart = port && port !== '80' && port !== '443' ? `:${port}` : '';
                    return `${protocol}//${hostname}${portPart}`;
                }
                return 'http://localhost'; // Development fallback
            };

            const baseUrl = currentConfig.wadoRoot || getServerUrl();
            const apiPath = `/xapi/viewer/projects/${projectId}/subjects/${subjectId}`;
            const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, currentConfig);
            const headers = this.configManager.getAuthorizationHeader();
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', ...headers }
            });
            if (!response.ok) {
                log.error('XNAT: Failed to fetch subject metadata', response.status, response.statusText);
                throw new Error(`XNAT API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            log.error('XNAT: Error fetching subject metadata:', error);
            throw error;
        }
    }

    /**
     * Get project metadata from XNAT
     */
    async getProjectMetadata(projectId: string) {
        if (!projectId) {
            log.error('XNAT: Missing projectId for metadata fetch');
            return null;
        }
        try {
            const currentConfig = this.configManager.getConfig();

            // Dynamic server URL detection for robust deployment
            const getServerUrl = () => {
                if (typeof window !== 'undefined' && window.location) {
                    const { protocol, hostname, port } = window.location;
                    const portPart = port && port !== '80' && port !== '443' ? `:${port}` : '';
                    return `${protocol}//${hostname}${portPart}`;
                }
                return 'http://localhost'; // Development fallback
            };

            const baseUrl = currentConfig.wadoRoot || getServerUrl();
            const apiPath = `/xapi/viewer/projects/${projectId}`;
            const apiUrl = convertToAbsoluteUrl(apiPath, baseUrl, currentConfig);
            const headers = this.configManager.getAuthorizationHeader();
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', ...headers }
            });
            if (!response.ok) {
                log.error('XNAT: Failed to fetch project metadata', response.status, response.statusText);
                throw new Error(`XNAT API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            log.error('XNAT: Error fetching project metadata:', error);
            throw error;
        }
    }
}
