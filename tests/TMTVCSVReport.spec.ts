import { test, expect } from 'playwright-test-coverage';
import { visitStudy, simulateNormalizedClickOnElement } from './utils/index';
import { viewportLocator } from './utils/locators';
import { downloadAsString } from './utils/download';
import toArray from 'extensions/dicom-microscopy/src/utils/toArray';

test('should create and download the TMTV CSV report correctly', async ({ page }) => {
  const studyInstanceUID = '1.2.840.113619.2.290.3.3767434740.226.1600859119.501';
  const mode = 'tmtv';
  await visitStudy(page, studyInstanceUID, mode, 10000);

  await page.getByTestId('addSegmentation').click();
  await page.getByTestId('Brush-btn').click();

  await simulateNormalizedClickOnElement({
    locator: viewportLocator({ viewportId: 'ctAXIAL', page }),
    normalizedPoint: { x: 0.5, y: 0.5 },
  });

  await page.waitForTimeout(5000);

  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('exportTmtvCsvReport').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename(), 'Not the correct file name for the TMTV CSV report.').toBe(
    '202009231_tmtv.csv'
  );

  const tmtvCSVReportContent: string = await downloadAsString(download);

  const expectedHeaders =
    'PatientID,PatientName,SeriesInstanceUID,StudyDate,StudyInstanceUID,center,count,id,kurtosis,label,lesionGlycolysis,max,maxLPS,mean,median,min,minLPS,peakLPS,peakValue,skewness,stdDev,volume';

  const tmtvCSVReportHeaders = tmtvCSVReportContent
    .substring(0, expectedHeaders.length)
    .split(',')
    .sort()
    .join(',');

  expect(
    tmtvCSVReportHeaders,
    'Expected the file to start with specific column/value headers'
  ).toBe(expectedHeaders);

  expect(tmtvCSVReportContent, 'Expected the patient name to be present').toContain(
    'Water Phantom'
  );
  expect(tmtvCSVReportContent).toContain('Patient ID,202009231');
  expect(tmtvCSVReportContent).toContain('Study Date,20200923');
  expect(tmtvCSVReportContent, 'Expected no objects to be output.').not.toContain(
    '[object Object]'
  );
});
