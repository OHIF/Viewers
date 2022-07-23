import React from 'react';
import { detect } from 'detect-browser';
import './DebugReportModal.css';
import { ToolbarButton } from '@ohif/ui';
import { utils } from '@ohif/core';
const { studyMetadataManager } = utils;

const DubugReportModal = ({
  viewports,
  studies,
  servers,
  extensionManager,
  mailTo,
  debugModalMessage,
  errors = [],
}) => {
  const copyDebugDataToClipboard = () => {
    const body = getEmailBody();

    const textArea = document.createElement('textarea');

    textArea.value = body;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  };

  const getEmailBody = () => {
    let body = `Enter the description of your problem here: \n\n\n`;

    body += `============= SESSION INFO =============\n\n`;

    // App version

    body += '== App ==\n';
    body += `version\t${window.version}\n\n`;

    // Extensions Versions

    body += '== Extensions Versions ==\n';

    const { registeredExtensionVesions } = extensionManager;

    Object.keys(registeredExtensionVesions).forEach(extensionId => {
      const version = registeredExtensionVesions[extensionId];

      body += `${extensionId}\t${version}\n`;
    });

    body += '\n';

    // Browser Info

    const browser = detect();

    const { name, os, type, version } = browser;

    body += '== Browser Info ==\n';
    body += `name\t ${name}\n`;
    body += `os\t ${os}\n`;
    body += `type\t ${type}\n`;
    body += `version\t ${version}\n\n`;

    // Study URL
    body += '== URL ==\n';
    body += `URL\t ${window.location.href}\n\n`;

    // Layout
    const { numRows, numColumns, viewportSpecificData } = viewports;

    body += '== Viewport Layout ==\n';
    body += `Rows\t${numRows}\n`;
    body += `Columns\t${numColumns}\n\n`;
    body += '== SeriesInstanceUIDs ==\n';

    Object.keys(viewportSpecificData).forEach(viewportIndex => {
      const vsd = viewportSpecificData[viewportIndex];

      const [row, column] = _viewportIndexToViewportPosition(
        viewportIndex,
        numColumns
      );

      body += `[${row},${column}]\t${vsd.SeriesInstanceUID}\n`;
    });

    body += '== ReferencedSEGSeriesInstanceUIDs ==\n';

    Object.keys(viewportSpecificData).forEach(viewportIndex => {
      const displaySet = viewportSpecificData[viewportIndex];
      const [referencedDisplaySetsRef] = _getReferencedSeriesInstanceUIDsString(
        displaySet,
        'SEG'
      );

      const [row, column] = _viewportIndexToViewportPosition(
        viewportIndex,
        numColumns
      );

      body += `[${row},${column}]\t${referencedDisplaySetsRef}\n`;
    });

    body += '== ReferencedRTSTRUCTSeriesInstanceUIDs ==\n';

    Object.keys(viewportSpecificData).forEach(viewportIndex => {
      const displaySet = viewportSpecificData[viewportIndex];
      const [referencedDisplaySetsRef] = _getReferencedSeriesInstanceUIDsString(
        displaySet,
        'RTSTRUCT'
      );

      const [row, column] = _viewportIndexToViewportPosition(
        viewportIndex,
        numColumns
      );

      body += `[${row},${column}]\t${referencedDisplaySetsRef}\n`;
    });

    body += '== ReferencedSRSeriesInstanceUIDs ==\n';

    Object.keys(viewportSpecificData).forEach(viewportIndex => {
      const displaySet = viewportSpecificData[viewportIndex];
      const [referencedDisplaySetsRef] = _getReferencedSeriesInstanceUIDsString(
        displaySet,
        'SR'
      );

      const [row, column] = _viewportIndexToViewportPosition(
        viewportIndex,
        numColumns
      );

      body += `[${row},${column}]\t${referencedDisplaySetsRef}\n`;
    });

    return body;
  };

  const mailToFunction = () => {
    const StudyInstanceUID = Object.keys(studies.studyData)[0];

    const subject = encodeURI(`Issue with Study: ${StudyInstanceUID}`);

    let body = getEmailBody();

    // TODO Text dump of rest of stuff.

    body = encodeURI(body);

    window.location.href = `mailto:${mailTo}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="debug-report-modal-container">
      {debugModalMessage ? <p>{debugModalMessage}</p> : null}
      <div className="debug-report-modal-buttons-container">
        {mailTo ? (
          <div>
            <ToolbarButton
              label={'Send Bug Report'}
              onClick={mailToFunction}
              icon={'envelope-square'}
              isActive={false}
            />
          </div>
        ) : null}
        <div>
          <ToolbarButton
            label={'Copy To Clipboard'}
            onClick={copyDebugDataToClipboard}
            icon={'clipboard'}
            isActive={false}
          />
        </div>
      </div>
      <div>
        <table>
          {getAppVersion()}
          {getExtensionVersions(extensionManager)}
          {getBrowserInfo()}
          {getCurrentStudyUrl()}
          {getLayout(viewports)}
        </table>
      </div>
      <div className="errors">
        <h3>Errors ({errors.length})</h3>
        <div className="errors-container">
          {errors.map(error => {
            return (
              <div>
                <pre>Message: {error.message}</pre>
                {error.error && <pre>Stack: {error.error.stack}</pre>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const getAppVersion = () => {
  return (
    <React.Fragment>
      <tr>
        <th className="debugReportModalHeader">App</th>
      </tr>
      <tr>
        <td>Version</td>
        <td>{window.version}</td>
      </tr>
    </React.Fragment>
  );
};

const getCurrentStudyUrl = () => {
  return (
    <React.Fragment>
      <tr>
        <th className="debugReportModalHeader">URL</th>
      </tr>
      <tr>
        <td>URL</td>
        <td className="debug-overflowText">{window.location.href}</td>
      </tr>
    </React.Fragment>
  );
};

const getExtensionVersions = extensionManager => {
  const { registeredExtensionVesions } = extensionManager;

  const lineItems = Object.keys(registeredExtensionVesions).map(extensionId => {
    const version = registeredExtensionVesions[extensionId];

    return (
      <tr>
        <td>{extensionId}</td>
        <td>{version}</td>
      </tr>
    );
  });

  return (
    <React.Fragment>
      <th className="debugReportModalHeader">Extensions</th>
      {lineItems}
    </React.Fragment>
  );
};

const getLayout = viewports => {
  const { numRows, numColumns } = viewports;

  return (
    <React.Fragment>
      <tr>
        <th className="debugReportModalHeader">Viewports</th>
      </tr>
      <tr>
        <th>Layout</th>
      </tr>
      <tr>
        <td>Rows</td>
        <td>{numRows}</td>
      </tr>
      <tr>
        <td>Columns</td>
        <td>{numColumns}</td>
      </tr>
      <tr>
        <th>SeriesInstanceUIDs</th>
      </tr>
      {getSeriesInstanceUIDsPerRow(viewports)}
      <tr>
        <th>ReferencedSEGSeriesInstanceUIDs</th>
      </tr>
      {getReferencedSeriesInstanceUIDsPerRow(viewports, 'SEG')}
      <tr>
        <th>ReferencedRTSTRUCTSeriesInstanceUIDs</th>
      </tr>
      {getReferencedSeriesInstanceUIDsPerRow(viewports, 'RTSTRUCT')}
      <tr>
        <th>ReferencedSRSeriesInstanceUIDs</th>
      </tr>
      {getReferencedSeriesInstanceUIDsPerRow(viewports, 'SR')}
    </React.Fragment>
  );
};

const getBrowserInfo = () => {
  const browser = detect();

  const { name, os, type, version } = browser;

  return (
    <React.Fragment>
      <tr>
        <th className="debugReportModalHeader">Platform</th>
      </tr>
      <tr>
        <td>name</td>
        <td>{name}</td>
      </tr>
      <tr>
        <td>os</td>
        <td>{os}</td>
      </tr>
      <tr>
        <td>type</td>
        <td>{type}</td>
      </tr>
      <tr>
        <td>version</td>
        <td>{version}</td>
      </tr>
    </React.Fragment>
  );
};

/**
 * Returns DisplaySets that reference the target series, sorted by dateTime
 *
 * @param {string} StudyInstanceUID
 * @param {string} SeriesInstanceUID
 * @returns Array
 */
const _getReferencedDisplaysets = (
  StudyInstanceUID,
  SeriesInstanceUID,
  Modality
) => {
  /* Referenced DisplaySets */
  const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
  const referencedDisplaysets = studyMetadata.getDerivedDatasets({
    referencedSeriesInstanceUID: SeriesInstanceUID,
    Modality,
  });

  /* Sort */
  referencedDisplaysets.sort((a, b) => {
    const aNumber = Number(`${a.SeriesDate}${a.SeriesTime}`);
    const bNumber = Number(`${b.SeriesDate}${b.SeriesTime}`);
    return bNumber - aNumber;
  });

  return referencedDisplaysets;
};

const _getReferencedSeriesInstanceUIDsString = (displaySet, Modality) => {
  const referencedDisplaySets = _getReferencedDisplaysets(
    displaySet.StudyInstanceUID,
    displaySet.SeriesInstanceUID,
    Modality
  );

  let referencedDisplaySetsRef = 'None';
  const referencedDisplaySetsCount = referencedDisplaySets.length;
  if (referencedDisplaySetsCount !== 0) {
    referencedDisplaySetsRef = '';
    for (let i = 0; i < referencedDisplaySetsCount - 1; i++) {
      referencedDisplaySetsRef +=
        referencedDisplaySets[i].SeriesInstanceUID + ', ';
    }
    referencedDisplaySetsRef +=
      referencedDisplaySets[referencedDisplaySetsCount - 1].SeriesInstanceUID;
  }

  return [referencedDisplaySetsRef, referencedDisplaySetsCount];
};

const getReferencedSeriesInstanceUIDsPerRow = (viewports, Modality) => {
  const { viewportSpecificData, numColumns } = viewports;

  // NOTE viewportSpecificData is actually an object with numerical keys.
  return Object.keys(viewportSpecificData).map(viewportIndex => {
    const displaySet = viewportSpecificData[viewportIndex];
    const [
      referencedDisplaySetsRef,
      referencedDisplaySetsCount,
    ] = _getReferencedSeriesInstanceUIDsString(displaySet, Modality);

    const [row, column] = _viewportIndexToViewportPosition(
      viewportIndex,
      numColumns
    );

    if (referencedDisplaySetsCount > 1) {
      return (
        <tr>
          <td>{`[${row},${column}]`}</td>
          <td className="debug-overflowText-border">
            {referencedDisplaySetsRef}
          </td>
        </tr>
      );
    } else {
      return (
        <tr>
          <td>{`[${row},${column}]`}</td>
          <td className="debug-overflowText">{referencedDisplaySetsRef}</td>
        </tr>
      );
    }
  });
};

const getSeriesInstanceUIDsPerRow = viewports => {
  const { viewportSpecificData, numColumns } = viewports;

  // NOTE viewportSpecificData is actually an object with numerical keys.
  return Object.keys(viewportSpecificData).map(viewportIndex => {
    const vsd = viewportSpecificData[viewportIndex];

    const [row, column] = _viewportIndexToViewportPosition(
      viewportIndex,
      numColumns
    );

    return (
      <tr>
        <td>{`[${row},${column}]`}</td>
        <td>{vsd.SeriesInstanceUID}</td>
      </tr>
    );
  });
};

const _viewportIndexToViewportPosition = (viewportIndex, numColumns) => {
  const row = Math.floor(viewportIndex / numColumns);
  const column = viewportIndex % numColumns;

  return [row, column];
};

export default DubugReportModal;
