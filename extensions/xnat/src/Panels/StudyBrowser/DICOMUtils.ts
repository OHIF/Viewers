/**
 * DICOM tag extraction and metadata utilities
 * Extracted from PanelStudyBrowser.tsx
 */

/**
 * Deeply inspects an instance object to find DICOM tags in various locations
 * @param {Object} instance - The DICOM instance object
 * @param {string} tagName - The DICOM tag name to look for (e.g., 'SeriesDescription')
 * @param {string} tagId - The DICOM tag ID as string (e.g., '0008103E' for SeriesDescription)
 * @returns {string|null} - The found value or null
 */
export function findDicomTag(instance, tagName, tagId) {
    if (!instance) return null;

    // Common tag IDs for reference
    const tagIds = {
        'SeriesDescription': '0008103E',
        'SeriesNumber': '00200011',
        'Modality': '00080060',
        'ProtocolName': '00181030',
        'SequenceName': '00180024'
    };

    // Use provided tagId or lookup from map
    const actualTagId = tagId || tagIds[tagName] || '';

    // Direct property access
    if (instance[tagName] !== undefined) {
        return instance[tagName];
    }

    // Check metadata
    if (instance.metadata) {
        // Direct property on metadata
        if (instance.metadata[tagName] !== undefined) {
            return instance.metadata[tagName];
        }

        // Try lowercase version
        if (instance.metadata[tagName.toLowerCase()] !== undefined) {
            return instance.metadata[tagName.toLowerCase()];
        }

        // Check if it's in a metadata.elements structure (common in OHIF)
        if (instance.metadata.elements && instance.metadata.elements[actualTagId]) {
            const element = instance.metadata.elements[actualTagId];
            if (element.Value) return element.Value[0];
        }
    }

    // Check _instance
    if (instance._instance) {
        if (instance._instance[tagName] !== undefined) {
            return instance._instance[tagName];
        }

        // Try lowercase version
        if (instance._instance[tagName.toLowerCase()] !== undefined) {
            return instance._instance[tagName.toLowerCase()];
        }
    }

    // Check DICOM dataset if available
    if (instance.dataset) {
        if (typeof instance.dataset.string === 'function') {
            try {
                if (actualTagId) {
                    const foundValue = instance.dataset.string('x' + actualTagId);
                    if (foundValue) return foundValue;
                }
            } catch (e) {
                // Ignore errors
            }
        }

        // Direct property on dataset
        if (instance.dataset[tagName] !== undefined) {
            return instance.dataset[tagName];
        }
    }

    // Check any data property
    if (instance.data) {
        if (instance.data[tagName] !== undefined) {
            return instance.data[tagName];
        }

        // Some implementations nest it deeper
        if (instance.data.elements && instance.data.elements[actualTagId]) {
            const element = instance.data.elements[actualTagId];
            if (element.Value) return element.Value[0];
        }
    }

    // Check for raw DICOM tags object
    if (instance.tags) {
        if (instance.tags[actualTagId] !== undefined) {
            const tag = instance.tags[actualTagId];
            return tag.Value ? tag.Value[0] : tag;
        }
    }

    // Look at all dicomJSON style objects
    const possibleTagContainers = [
        instance,
        instance.metadata,
        instance._instance,
        instance.dataset,
        instance.data
    ];

    for (const container of possibleTagContainers) {
        if (!container) continue;

        // Check dicomElements structure
        if (container.dicomElements) {
            const element = container.dicomElements[actualTagId] || container.dicomElements[tagName];
            if (element) {
                if (element.Value) return element.Value[0];
                return element;
            }
        }

        // Check for 00080103E style DICOM tag access
        if (actualTagId && container[actualTagId] !== undefined) {
            return container[actualTagId];
        }
    }

    return null;
}

/**
 * Attempts to extract DICOM tags directly from cornerstone metadata
 * This is a more direct approach that might work when other methods fail
 * @param {Object} instance - The instance object
 * @param {string} tagName - Name of the tag to find (e.g. SeriesDescription)
 * @returns {string|null} - The value or null if not found
 */
export function extractTagFromCornerstone(instance, tagName) {
    if (!instance) return null;

    // Tag mappings for cornerstone
    const tagMappings = {
        'SeriesDescription': { tag: '0008,103E', keyword: 'SeriesDescription' },
        'SeriesNumber': { tag: '0020,0011', keyword: 'SeriesNumber' },
        'Modality': { tag: '0008,0060', keyword: 'Modality' },
        'StudyDescription': { tag: '0008,1030', keyword: 'StudyDescription' },
        'PatientName': { tag: '0010,0010', keyword: 'PatientName' },
        'PatientID': { tag: '0010,0020', keyword: 'PatientID' },
        'SeriesInstanceUID': { tag: '0020,000E', keyword: 'SeriesInstanceUID' },
        'SOPInstanceUID': { tag: '0008,0018', keyword: 'SOPInstanceUID' },
        'StudyInstanceUID': { tag: '0020,000D', keyword: 'StudyInstanceUID' }
    };

    // If we don't have a mapping for this tag, return null
    if (!tagMappings[tagName]) return null;

    const tagInfo = tagMappings[tagName];

    // Try various paths where cornerstone metadata might be found
    const paths = [
        'metadata',
        '_instance',
        'data',
        'dataset',
        ''  // instance itself
    ];

    for (const path of paths) {
        const obj = path ? instance[path] : instance;
        if (!obj) continue;

        // Explicit cornerstone metadata format
        if (obj.Elements) {
            const tagKey = tagInfo.tag.replace(',', '');
            if (obj.Elements[tagKey]) {
                return obj.Elements[tagKey].Value;
            }
        }

        // Standard DICOM JSON format
        if (obj[tagInfo.tag]) {
            const element = obj[tagInfo.tag];
            if (typeof element === 'string') return element;
            if (element.Value) return element.Value[0];
            if (element.value) return element.value;
        }

        // Try the keyword directly
        if (obj[tagInfo.keyword]) {
            return obj[tagInfo.keyword];
        }

        // Try alternative formats that might be used
        if (obj.elements && obj.elements[tagInfo.tag.replace(',', '')]) {
            const element = obj.elements[tagInfo.tag.replace(',', '')];
            if (element.Value) return element.Value[0];
        }

        // Some cornerstone implementations use a parsedDicomData structure
        if (obj.parsedDicomData) {
            const tagKey = tagInfo.tag.replace(',', '');
            if (obj.parsedDicomData[tagKey]) {
                const element = obj.parsedDicomData[tagKey];
                if (element.Value) return element.Value[0];
            }
        }
    }

    return null;
}

/**
 * Extracts important DICOM metadata from an instance for debugging
 * @param {Object} instance - DICOM instance
 * @returns {Record<string, any>} - Simplified metadata object
 */
export function extractDebugMetadata(instance: any): Record<string, any> {
    if (!instance) return {};

    // Extract key fields
    const metadata: Record<string, any> = {};

    // Common DICOM fields to extract for debugging
    const fieldsToExtract = [
        'SeriesDescription', 'SeriesNumber', 'Modality', 'ProtocolName',
        'SeriesInstanceUID', 'SOPInstanceUID', 'StudyInstanceUID',
        'PatientName', 'PatientID', 'StudyDescription', 'StudyDate',
        'SequenceName', 'ImageType'
    ];

    // First try standard access
    fieldsToExtract.forEach(field => {
        const value = findDicomTag(instance, field, '');
        if (value) {
            metadata[field] = value;
        }
    });

    // Then check for metadata in instance
    if (instance.metadata) {
        metadata.hasMetadata = true;

        // Direct access to metadata fields
        fieldsToExtract.forEach(field => {
            if (!metadata[field] && instance.metadata[field] !== undefined) {
                metadata[field] = instance.metadata[field];
            }
        });

        // Record available keys for debugging
        metadata.metadataKeys = Object.keys(instance.metadata).slice(0, 10);
    }

    // Also look in _instance if available
    if (instance._instance) {
        metadata.has_instance = true;

        // Direct access to _instance fields
        fieldsToExtract.forEach(field => {
            if (!metadata[field] && instance._instance[field] !== undefined) {
                metadata[field] = instance._instance[field];
            }
        });

        metadata._instanceKeys = Object.keys(instance._instance).slice(0, 10);
    }

    // Check dataset if available
    if (instance.dataset) {
        metadata.hasDataset = true;

        // Try dataset access for any missing fields
        fieldsToExtract.forEach(field => {
            if (!metadata[field] && instance.dataset[field] !== undefined) {
                metadata[field] = instance.dataset[field];
            }
        });
    }

    return metadata;
}

/**
 * Deeply inspects metadata object for DICOM tags
 * @param {Object} instance - The DICOM instance to inspect
 * @returns {Object} - Extracted metadata
 */
export function inspectMetadataDeep(instance) {
    const result = {
        SeriesDescription: null,
        SeriesNumber: null,
        Modality: null,
        found: false,
        source: null
    };

    // Skip if no instance
    if (!instance) return result;

    // Try direct properties on instance
    if (instance.SeriesDescription) {
        result.SeriesDescription = instance.SeriesDescription;
        result.found = true;
        result.source = 'instance.direct';
    }

    // Check if instance has metadata property
    if (instance.metadata) {
        // Try direct properties on metadata
        if (instance.metadata.SeriesDescription) {
            result.SeriesDescription = instance.metadata.SeriesDescription;
            result.found = true;
            result.source = 'instance.metadata.direct';
        }

        // XNAT specific: Check for tags property
        if (instance.metadata.tags) {
            if (instance.metadata.tags['0008,103E']) {
                result.SeriesDescription = instance.metadata.tags['0008,103E'].Value?.[0] || instance.metadata.tags['0008,103E'].value;
                result.found = true;
                result.source = 'instance.metadata.tags';
            }
        }

        // Check for nested elements property
        if (instance.metadata.elements) {
            if (instance.metadata.elements['0008103E']) {
                result.SeriesDescription = instance.metadata.elements['0008103E'].Value?.[0];
                result.found = true;
                result.source = 'instance.metadata.elements';
            }
        }

        // Check for PatientStudyModule
        if (instance.metadata.PatientStudyModule) {
            if (instance.metadata.PatientStudyModule.SeriesDescription) {
                result.SeriesDescription = instance.metadata.PatientStudyModule.SeriesDescription;
                result.found = true;
                result.source = 'instance.metadata.PatientStudyModule';
            }
        }

        // Check for GeneralSeriesModule
        if (instance.metadata.GeneralSeriesModule) {
            if (instance.metadata.GeneralSeriesModule.SeriesDescription) {
                result.SeriesDescription = instance.metadata.GeneralSeriesModule.SeriesDescription;
                result.found = true;
                result.source = 'instance.metadata.GeneralSeriesModule';
            }
        }

        // Check for SeriesDescriptionCodeSequence
        if (instance.metadata.SeriesDescriptionCodeSequence) {
            if (instance.metadata.SeriesDescriptionCodeSequence.CodeMeaning) {
                result.SeriesDescription = instance.metadata.SeriesDescriptionCodeSequence.CodeMeaning;
                result.found = true;
                result.source = 'instance.metadata.SeriesDescriptionCodeSequence';
            }
        }
    }

    // Try _instance if available
    if (instance._instance) {
        if (instance._instance.SeriesDescription) {
            result.SeriesDescription = instance._instance.SeriesDescription;
            result.found = true;
            result.source = 'instance._instance';
        }

        // Try inside the data property
        if (instance._instance.data) {
            if (instance._instance.data.SeriesDescription) {
                result.SeriesDescription = instance._instance.data.SeriesDescription;
                result.found = true;
                result.source = 'instance._instance.data';
            }

            // Try elements
            if (instance._instance.data.elements) {
                if (instance._instance.data.elements['0008103E']) {
                    result.SeriesDescription = instance._instance.data.elements['0008103E'].Value?.[0];
                    result.found = true;
                    result.source = 'instance._instance.data.elements';
                }
            }
        }
    }

    // Also get series number and modality if available using similar approach
    // For brevity, checking only the most common locations
    result.SeriesNumber =
        instance.SeriesNumber ||
        (instance.metadata && instance.metadata.SeriesNumber) ||
        (instance.metadata && instance.metadata.tags && instance.metadata.tags['0020,0011']?.Value?.[0]) ||
        (instance._instance && instance._instance.SeriesNumber) ||
        '';

    result.Modality =
        instance.Modality ||
        (instance.metadata && instance.metadata.Modality) ||
        (instance.metadata && instance.metadata.tags && instance.metadata.tags['0008,0060']?.Value?.[0]) ||
        (instance._instance && instance._instance.Modality) ||
        '';

    return result;
}

/**
 * Directly access Cornerstone dicom parser format metadata
 * This is a special format sometimes used in OHIF for cornerstone images
 * @param {Object} displaySet - The display set
 * @param {string} tag - The DICOM tag like '0008103E' for SeriesDescription
 * @returns {string|null} - The extracted value or null if not found
 */
export function getCornerstoneMetadata(displaySet, tag) {
    if (!displaySet || !tag) return null;

    // Make sure we have the right format
    if (!displaySet.images || !Array.isArray(displaySet.images) || displaySet.images.length === 0) {
        return null;
    }

    // Try to find the tag in the first image's metadata
    const firstImage = displaySet.images[0];
    if (!firstImage) return null;

    // Try to access using the Cornerstone method if available
    if (firstImage.data && typeof firstImage.data.string === 'function') {
        try {
            return firstImage.data.string(tag);
        } catch (e) {
            // Ignore errors
        }
    }

    // Try to get it from the image object directly
    if (firstImage.data && firstImage.data[tag]) {
        const value = firstImage.data[tag];
        if (typeof value === 'string') return value;
        if (value.Value) return value.Value[0];
    }

    // Try to access dicom metadata object
    if (firstImage.metadata) {
        const metadata = firstImage.metadata;

        // Try standard DICOM JSON format
        if (metadata[tag]) {
            const value = metadata[tag];
            if (typeof value === 'string') return value;
            if (value.Value) return value.Value[0];
        }

        // Try elements format
        if (metadata.elements && metadata.elements[tag]) {
            const element = metadata.elements[tag];
            if (element.Value) return element.Value[0];
        }
    }

    return null;
}

/**
 * Safely logs objects, handling circular references and large arrays
 * @param {string} prefix - Log prefix
 * @param {any} obj - Object to log
 */
export function safeLog(prefix: string, obj: any): void {
    try {
        const cache = new WeakSet();
        const safeObj = JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                // Handle circular references
                if (cache.has(value)) {
                    return '[Circular Reference]';
                }
                cache.add(value);

                // Handle large arrays
                if (Array.isArray(value) && value.length > 10) {
                    return `[Array with ${value.length} items]`;
                }
            }
            return value;
        }, 2);

        if (safeObj.length > 500) {
            console.log(`${prefix} (truncated):`, safeObj.substring(0, 500) + '...');
        } else {
            console.log(`${prefix}:`, safeObj);
        }
    } catch (error) {
        console.log(`${prefix} (not serializable):`, Object.keys(obj));
    }
}
