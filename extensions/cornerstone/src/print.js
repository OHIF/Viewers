import { getEnabledElement } from './state';
import cornerstone from 'cornerstone-core';

// Get Proteus OHIF configuration
function getProteusConfig(readyCb, errorCb) {
  fetch('/api/v1/ohif/print')
    .then(res => res.json())
    .then(
      result => {
        if(result.status === 'done' && result.ohif !== undefined) {
          readyCb(result.ohif);
        } else {
          errorCb('Invalid response.');
        }
      },
      error => {
        errorCb(error);
      }
    );
}

function studyData(imageId) {
  let metadata = {
    patientName: '',
    patientID: '',
    accessionNumber: '',
    studyDate: '',
    studyTime: '',
  };

  let patientNameInput = cornerstone.metaData.get('PatientName', imageId)
    .Alphabetic;
  let patientIDInput = cornerstone.metaData.get('PatientID', imageId);
  let accessionNumberInput = cornerstone.metaData.get(
    'AccessionNumber',
    imageId
  );
  let studyDateInput = cornerstone.metaData.get('StudyDate', imageId);
  let studyTimeInput = cornerstone.metaData.get('StudyTime', imageId);

  if (typeof patientNameInput === 'string') {
    metadata.patientName = patientNameInput.replaceAll('^', ' ').trim();
  }

  if (typeof patientIDInput === 'string') {
    metadata.patientID = patientIDInput.trim();
  }

  if (typeof accessionNumberInput === 'string') {
    metadata.accessionNumber = accessionNumberInput.trim();
  }

  if (typeof studyDateInput === 'string') {
    if (studyDateInput.length === 8) {
      metadata.studyDate = studyDateInput[6] + studyDateInput[7] + '/';
      metadata.studyDate += studyDateInput[4] + studyDateInput[5] + '/';
      metadata.studyDate +=
        studyDateInput[0] +
        studyDateInput[1] +
        studyDateInput[2] +
        studyDateInput[3];
    } else {
      metadata.studyDate = studyDateInput;
    }
  }

  if (typeof studyTimeInput === 'string') {
    metadata.studyTime = studyTimeInput[0] + studyTimeInput[1] + ':';
    metadata.studyTime += studyTimeInput[2] + studyTimeInput[3] + ':';
    metadata.studyTime += studyTimeInput[4] + studyTimeInput[5];
  }

  console.log(metadata);

  return metadata;
}

function createTitle(metadata, printTitle) {
  let title = '';

  if (typeof printTitle != 'undefined') {
    title = printTitle;
  } else {
    title =
      '%PatientID% %PatientName% %AccessionNumber% %StudyDate% %StudyTime%';
  }

  return title
    .replaceAll('%PatientID%', metadata.patientID)
    .replaceAll('%PatientName%', metadata.patientName)
    .replaceAll('%AccessionNumber%', metadata.accessionNumber)
    .replaceAll('%StudyDate%', metadata.studyDate)
    .replaceAll('%StudyTime%', metadata.studyTime);
}

export default function print({ viewports }) {
  getProteusConfig(
    proteusConfig => {
      const element = getEnabledElement(viewports.activeViewportIndex);
      const metadata = studyData(
        cornerstone.getEnabledElement(element).image.imageId
      );

      let pictures = '';
      let logo = '';

      for (let row = 0; row < viewports.numRows; row++) {
        pictures += '<ul class="flex-container">';
        for (let columns = 0; columns < viewports.numColumns; columns++) {
          var enabledElement = getEnabledElement(
            columns + viewports.numColumns * row
          );
          var canvas = enabledElement.firstElementChild;

          pictures +=
            '<li class="flex-item"><img src="' +
            canvas.toDataURL() +
            '"/></li>';
        }
        pictures += '</ul>';
      }

      if(typeof proteusConfig.printLogo !== 'undefined') {
        logo = proteusConfig.printLogo;
      }

      let printCode = `
          <html>
              <head>
                  <title>${document.title}</title>
                  <style>
                      .logo {
                        float: right;
                        max-height: 35px;
                      }
                      .title {
                        text-align: center;
                      }
                      .flex-container {
                        display: flex;
                        list-style: none;
                        align-items: baseline;
                      }
                  </style>
              </head>
              <body>
                <img class="logo" src="${logo}" />
                <div class="title">
                    <h3>${createTitle(
                      metadata,
                      proteusConfig.printTitle
                    )}</h3>
                </div>
                ${pictures}
              </body>
          </html>
      `;

      const popup = window.open('', 'PRINT');
      popup.document.write(printCode);

      setTimeout(() => {
        popup.document.close(); // necessary for IE >= 10
        popup.focus(); // necessary for IE >= 10*/
        popup.print();
        popup.close();
      });

      return true;
    },
    err => {
      throw err;
      return true;
    }
  );
}
