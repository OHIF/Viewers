/**
 * Segmentation export utilities
 * Extracted from segmentationCommands.ts
 */

import dcmjs from 'dcmjs';
import DICOMSEGExporter from '../utils/IO/classes/DICOMSEGExporter';
import sessionMap from '../utils/sessionMap';
import { generateSegmentation } from './SegmentationGenerators';

const { datasetToBlob } = dcmjs.data;

export interface SegmentationExporterParams {
  uiNotificationService: any;
  servicesManager: any;
}

/**
 * Sanitizes a label to be safe for XNAT export
 */
function sanitizeLabel(label: string): string {
  // Replace spaces with underscores, remove special characters except underscores and hyphens
  return label
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .substring(0, 50); // Limit length
}

/**
 * Exports a segmentation to XNAT with user interaction for naming
 */
export async function exportSegmentationToXNAT(
  { segmentationId, seriesInstanceUID }: { segmentationId: string; seriesInstanceUID: string },
  {
    uiNotificationService,
    servicesManager,
    displaySet,
    segmentationService
  }: SegmentationExporterParams & { displaySet: any; segmentationService: any }
) {
  // Get segmentation data for the default label
  const segmentationData = segmentationService.getSegmentation(segmentationId);
  const defaultLabel = segmentationData?.label || 'Segmentation';

  // Prompt user for label with validation
  const userLabel = await new Promise<string | null>((resolve) => {
    const promptMessage = `Enter a name for the segmentation export to XNAT.\nOnly letters, numbers, underscores, and hyphens are allowed.\n\nCurrent name: ${sanitizeLabel(defaultLabel)}`;

    const userInput = window.prompt(promptMessage, sanitizeLabel(defaultLabel));

    if (userInput === null) {
      // User cancelled
      resolve(null);
    } else if (userInput.trim() === '') {
      // Empty input, use default
      resolve(sanitizeLabel(defaultLabel));
    } else {
      // Sanitize user input
      const sanitizedInput = sanitizeLabel(userInput.trim());
      resolve(sanitizedInput);
    }
  });

  // If user cancelled, exit early
  if (!userLabel) {
    return;
  }

  // Generate the DICOM SEG dataset
  const generatedData = generateSegmentation(
    { segmentationId },
    { segmentationService }
  );

  if (!generatedData || !generatedData.dataset) {
    throw new Error('Error during segmentation generation');
  }

  // Convert dataset to blob
  const segBlob = datasetToBlob(generatedData.dataset);

  // Try multiple approaches to get the experiment ID
  let experimentId = null;

  // 1. Try to get from sessionRouter service if available
  const { sessionRouter } = servicesManager.services;
  if (sessionRouter && sessionRouter.experimentId) {
    experimentId = sessionRouter.experimentId;
  }

  // 2. Try to get from sessionStorage
  if (!experimentId && window.sessionStorage) {
    experimentId = window.sessionStorage.getItem('xnat_experimentId');
  }

  // 3. Try to get from sessionMap using series UID
  if (!experimentId) {
    experimentId = sessionMap.getExperimentID(seriesInstanceUID);
  }

  // 4. Try to get from sessionMap without series UID (single session case)
  if (!experimentId) {
    experimentId = sessionMap.getExperimentID();
  }

  // 5. Try to get from study session data
  if (!experimentId) {
    const sessionData = sessionMap.get(displaySet.StudyInstanceUID);
    if (sessionData && sessionData.experimentId) {
      experimentId = sessionData.experimentId;
    }
  }

  // Use the existing XNAT DICOMSEGExporter with the experiment ID and user-provided label
  const exporter = new DICOMSEGExporter(segBlob, seriesInstanceUID, userLabel, experimentId);

  // Export to XNAT with retry logic for overwrite
  let exportSuccessful = false;
  let attempts = 0;
  const maxAttempts = 2;

  while (!exportSuccessful && attempts < maxAttempts) {
    try {
      const shouldOverwrite = attempts > 0; // First attempt without overwrite, second with overwrite
      await exporter.exportToXNAT(shouldOverwrite);
      exportSuccessful = true;

      // Show success notification
      uiNotificationService.show({
        title: 'Export Successful',
        message: `Segmentation "${userLabel}" exported to XNAT successfully`,
        type: 'success',
        duration: 3000,
      });

    } catch (error: any) {
      attempts++;

      // Check if this is a collection exists error and we haven't tried overwrite yet
      if (error.isCollectionExistsError && attempts === 1) {
        const shouldOverwrite = window.confirm(
          `A segmentation collection named "${userLabel}" already exists in XNAT.\n\n` +
          `Do you want to overwrite it?\n\n` +
          `Click "OK" to overwrite or "Cancel" to abort the export.`
        );

        if (!shouldOverwrite) {
          // User chose not to overwrite, exit
          return;
        }
        // Continue to next attempt (with overwrite)
      } else {
        // Show error notification
        uiNotificationService.show({
          title: 'Export Failed',
          message: `Failed to export segmentation: ${error.message}`,
          type: 'error',
          duration: 5000,
        });
        throw error;
      }
    }
  }
}

/**
 * Exports segmentation statistics to CSV format
 */
export function exportSegmentationStatisticsToCSV(
  { segmentationId }: { segmentationId: string },
  { segmentationService }: { segmentationService: any }
) {
  // Get the segmentation data
  const segmentationData = segmentationService.getSegmentation(segmentationId);

  if (!segmentationData) {
    throw new Error('Segmentation not found');
  }

  const csvRows: any[][] = [];

  // Add header information
  csvRows.push(['Segmentation Statistics Export']);
  csvRows.push(['Generated on', new Date().toISOString()]);
  csvRows.push(['Segmentation ID', segmentationId]);
  csvRows.push(['Segmentation Label', segmentationData.label || '']);
  csvRows.push([]);

  // Add basic information
  const info = segmentationData.cachedStats || {};
  csvRows.push(['Basic Information']);
  csvRows.push(['Volume (mm³)', info.volume || '']);
  csvRows.push(['Modified', info.modified ? 'Yes' : 'No']);
  csvRows.push(['Segments Count', Object.keys(segmentationData.segments || {}).length]);

  // Add reference information
  const additionalInfo = info.reference;
  if (additionalInfo) {
    csvRows.push([]);
    csvRows.push(['Reference Information']);
    const referenceKeys = [
      ['Series Number', additionalInfo.SeriesNumber],
      ['Series Instance UID', additionalInfo.SeriesInstanceUID],
      ['Study Instance UID', additionalInfo.StudyInstanceUID],
      ['Series Date', additionalInfo.SeriesDate],
      ['Series Time', additionalInfo.SeriesTime],
      ['Series Description', additionalInfo.SeriesDescription],
    ];

    referenceKeys.forEach(([key, value]) => {
      if (value) {
        csvRows.push([`reference ${key}`, value]);
      }
    });
  }

  // Add a blank row for separation
  csvRows.push([]);

  csvRows.push(['Segments Statistics']);
  // Add segment information in columns
  if (segmentationData.segments) {
    // First row: Segment headers
    const segmentHeaderRow = ['Label'];
    for (const segmentId in segmentationData.segments) {
      const segment = segmentationData.segments[segmentId];
      segmentHeaderRow.push(`${(segment as any).label || ''}`);
    }
    csvRows.push(segmentHeaderRow);

    // Add segment properties
    csvRows.push([
      'Segment Index',
      ...Object.values(segmentationData.segments).map((s: any) => s.segmentIndex || ''),
    ]);
    csvRows.push([
      'Locked',
      ...Object.values(segmentationData.segments).map((s: any) => (s.locked ? 'Yes' : 'No')),
    ]);
    csvRows.push([
      'Active',
      ...Object.values(segmentationData.segments).map((s: any) => (s.active ? 'Yes' : 'No')),
    ]);

    // Add segment statistics
    // First, collect all unique statistics across all segments
    const allStats = new Set();
    for (const segment of Object.values(segmentationData.segments) as any[]) {
      if (segment.cachedStats && segment.cachedStats.namedStats) {
        for (const statKey in segment.cachedStats.namedStats) {
          const stat = segment.cachedStats.namedStats[statKey];
          const statLabel = stat.label || stat.name;
          const statUnit = stat.unit ? ` (${stat.unit})` : '';
          allStats.add(`${statLabel}${statUnit}`);
        }
      }
    }

    // Then create a row for each statistic
    for (const statName of allStats) {
      const statRow = [statName];

      for (const segment of Object.values(segmentationData.segments) as any[]) {
        let statValue = '';

        if (segment.cachedStats && segment.cachedStats.namedStats) {
          for (const statKey in segment.cachedStats.namedStats) {
            const stat = segment.cachedStats.namedStats[statKey];
            const currentStatName = `${stat.label || stat.name}${stat.unit ? ` (${stat.unit})` : ''}`;

            if (currentStatName === statName) {
              statValue = stat.value !== undefined ? stat.value : '';
              break;
            }
          }
        }

        statRow.push(statValue);
      }

      csvRows.push(statRow);
    }
  }

  // Convert to CSV string
  let csvString = '';
  for (const row of csvRows) {
    const formattedRow = row.map(cell => {
      // Handle values that need to be quoted (contain commas, quotes, or newlines)
      const cellValue = cell !== undefined && cell !== null ? cell.toString() : '';
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        // Escape quotes and wrap in quotes
        return '"' + cellValue.replace(/"/g, '""') + '"';
      }
      return cellValue;
    });
    csvString += formattedRow.join(',') + '\n';
  }

  // Create and download the CSV file
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${segmentationData.label || 'segmentation'}_stats.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return csvString;
}
