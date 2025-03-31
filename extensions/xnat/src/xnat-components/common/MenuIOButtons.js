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
      <button title={exportDisabledMessage} disabled>
        Export
      </button>
    ) : (
      <button onClick={onExportButtonClick}>Export</button>
    );

    return (
      <div>
        {ImportCallbackOrComponent && (
          <button onClick={onImportButtonClick}>Import</button>
        )}
        {ExportCallbackOrComponent && (
          exportButton
        )}
      </div>
    );
  }
}
