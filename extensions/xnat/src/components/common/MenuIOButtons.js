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
    const { ExportCallbackOrComponent, onExportButtonClick } = this.props;

    // console.log({ Props: this.props });

    if (!ExportCallbackOrComponent) {
      return null;
    }

    return (
      <div>
        {ExportCallbackOrComponent && (
          <button onClick={onExportButtonClick}>Export</button>
        )}
      </div>
    );
  }
}
