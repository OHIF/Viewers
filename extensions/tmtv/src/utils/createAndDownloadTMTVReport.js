export default function createAndDownloadTMTVReport(segReport, additionalReportRows, options = {}) {
  const firstReport = segReport[Object.keys(segReport)[0]];
  const columns = Object.keys(firstReport);
  const csv = [
    columns
      .map(column =>
        column.toLowerCase().startsWith('namedstats_') ? column.substring(11) : column
      )
      .join(','),
  ];

  Object.values(segReport).forEach(segmentation => {
    const row = [];
    columns.forEach(column => {
      // if it is array then we need to replace , with space to avoid csv parsing error
      row.push(
        segmentation[column] && typeof segmentation[column] === 'object'
          ? Array.isArray(segmentation[column])
            ? segmentation[column].join(' ')
            : segmentation[column].value && Array.isArray(segmentation[column].value)
              ? segmentation[column].value.join(' ')
              : (segmentation[column].value ?? segmentation[column])
          : segmentation[column]
      );
    });
    csv.push(row.join(','));
  });

  csv.push('');
  csv.push('');
  csv.push('');

  csv.push(`Patient ID,${firstReport.PatientID}`);
  csv.push(`Study Date,${firstReport.StudyDate}`);
  csv.push('');
  additionalReportRows.forEach(({ key, value: values }) => {
    const temp = [];
    temp.push(`${key}`);
    Object.keys(values).forEach(k => {
      temp.push(`${k}`);
      temp.push(`${values[k]}`);
    });

    csv.push(temp.join(','));
  });

  const blob = new Blob([csv.join('\n')], {
    type: 'text/csv;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = options.filename ?? `${firstReport.PatientID}_tmtv.csv`;
  a.click();
}
