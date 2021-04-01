import { getEnabledElement } from './state';
import cornerstone from 'cornerstone-core';

function studyData(imageId) {
    let metadata = {
        patientName: '',
        patientID: '',
        accessionNumber: '',
        studyDate: '',
        studyTime: '',
    };

    let patientNameInput = cornerstone.metaData.get("PatientName", imageId).Alphabetic;
    let patientIDInput = cornerstone.metaData.get("PatientID", imageId);
    let accessionNumberInput = cornerstone.metaData.get("AccessionNumber", imageId);
    let studyDateInput = cornerstone.metaData.get("StudyDate", imageId);
    let studyTimeInput = cornerstone.metaData.get("StudyTime", imageId);

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
        if(studyDateInput.length === 8) {
            metadata.studyDate = studyDateInput[6] + studyDateInput[7] + '/';
            metadata.studyDate += studyDateInput[4] + studyDateInput[5] + '/';
            metadata.studyDate += studyDateInput[0] + studyDateInput[1] + studyDateInput[2] + studyDateInput[3];   
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

export default function print({ viewports }) {

    const element = getEnabledElement(viewports.activeViewportIndex);
    const metadata = studyData(cornerstone.getEnabledElement(element).image.imageId);

    let printCode = `
        <html>
          <head>
            <title>${document.title}</title>
            <style>
                div.title {
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
        `;

    printCode += '<div class="title"><h3>';
    printCode += metadata.patientID;
    printCode += " ";
    printCode += metadata.patientName;
    printCode += " ";
    printCode += metadata.accessionNumber;
    printCode += " ";
    printCode += metadata.studyDate;
    printCode += " ";
    printCode += metadata.studyTime;
    printCode += '</h3></div>';

    for (let row = 0; row < viewports.numRows; row++) {
      printCode += '<ul class="flex-container">';
      for (let columns = 0; columns < viewports.numColumns; columns++) {
        var enabledElement = getEnabledElement((columns) + (viewports.numColumns * row));
        var canvas = enabledElement.firstElementChild;

        printCode += '<li class="flex-item"><img src="';
        printCode += canvas.toDataURL();
        printCode += '"/></li>';
      }
      printCode += '</ul>'
    }

    const popup = window.open(
      '',
      'PRINT',
    );
    popup.document.write(printCode);

    setTimeout(() => {
      popup.document.close(); // necessary for IE >= 10
      popup.focus(); // necessary for IE >= 10*/
      popup.print();
      popup.close();
    });

    return true;
};