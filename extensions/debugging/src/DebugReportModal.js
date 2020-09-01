import React from 'react';
import { detect } from 'detect-browser';
import './DebugReportModal.css';

const DubugReportModal = ({
  viewports,
  studies,
  servers,
  extensionManager,
}) => {
  return (
    <div>
      <table>
        {getAppVersion()}
        {getExtensionVersions(extensionManager)}
        {getBrowserInfo()}
        {getCurrentStudyUrl()}
        {getLayout(viewports)}
      </table>
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
        <th className="debugReportModalHeader">App</th>
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

  debugger;

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
