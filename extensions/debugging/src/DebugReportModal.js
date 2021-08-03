import React from 'react';
import { detect } from 'detect-browser';
import './DebugReportModal.css';
import { ToolbarButton } from '@ohif/ui';

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
    body += '== Viewports ==\n';

    Object.keys(viewportSpecificData).forEach(viewportIndex => {
      const vsd = viewportSpecificData[viewportIndex];

      const [row, column] = _viewportIndexToViewportPosition(
        viewportIndex,
        numColumns
      );

      body += `[${row},${column}]\t${vsd.SeriesInstanceUID}\n`;
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
        <td>{window.location.href}</td>
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
