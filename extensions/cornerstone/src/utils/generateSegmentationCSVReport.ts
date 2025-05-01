export function generateSegmentationCSVReport(
  segmentationData,
  info: {
    reference: {
      SeriesNumber: string;
      SeriesInstanceUID: string;
      StudyInstanceUID: string;
      SeriesDate: string;
      SeriesTime: string;
      SeriesDescription: string;
    };
  }
) {
  // Initialize the rows for our CSV
  const csvRows = [];

  // Add segmentation-level information
  csvRows.push(['Segmentation ID', segmentationData.segmentationId || '']);
  csvRows.push(['Segmentation Label', segmentationData.label || '']);

  csvRows.push([]);

  const additionalInfo = info.reference;
  // Add reference information
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

  // Add a blank row for separation
  csvRows.push([]);

  csvRows.push(['Segments Statistics']);

  // Add segment information in columns
  if (segmentationData.segments) {
    // First row: Segment headers
    const segmentHeaderRow = ['Label'];
    for (const segmentId in segmentationData.segments) {
      const segment = segmentationData.segments[segmentId];
      segmentHeaderRow.push(`${segment.label || ''}`);
    }
    csvRows.push(segmentHeaderRow);

    // Add segment properties
    csvRows.push([
      'Segment Index',
      ...Object.values(segmentationData.segments).map(s => s.segmentIndex || ''),
    ]);
    csvRows.push([
      'Locked',
      ...Object.values(segmentationData.segments).map(s => (s.locked ? 'Yes' : 'No')),
    ]);
    csvRows.push([
      'Active',
      ...Object.values(segmentationData.segments).map(s => (s.active ? 'Yes' : 'No')),
    ]);

    // Add segment statistics
    // First, collect all unique statistics across all segments
    const allStats = new Set();
    for (const segment of Object.values(segmentationData.segments)) {
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

      for (const segment of Object.values(segmentationData.segments)) {
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

  // Create a download link and trigger the download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${segmentationData.label || 'Segmentation'}_Report_${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
