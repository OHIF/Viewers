import React from 'react';

/**
 * @class MenuIOButtons - Renders Import and/or Export buttons if
 * this.props.ImportCallbackOrComponent and/or
 * this.props.ExportCallbackOrComponent are defined.
 */
export default class MenuIOButtons extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const {
      ImportCallbackOrComponent,
      ExportCallbackOrComponent,
      onImportButtonClick,
      onExportButtonClick,
      exportDisabledMessage,
    } = this.props;

    if (!ImportCallbackOrComponent && !ExportCallbackOrComponent) {
      return null;
    }

    const exportButton = exportDisabledMessage ? (
      <button
        style={{ display: 'none' }}
        title={exportDisabledMessage}
        disabled
      >
        Export2
      </button>
    ) : (
      <button
        id="triggerExportSegmentations"
        style={{ display: 'none' }}
        onClick={onExportButtonClick}
      >
        Export3
      </button>
    );

    return (
      <div>
        {ImportCallbackOrComponent && (
          <button onClick={onImportButtonClick}>Import</button>
        )}
        {ExportCallbackOrComponent && exportButton}
      </div>
    );
  }
}
