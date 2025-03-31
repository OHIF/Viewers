import React from 'react';

import '../XNATSegmentationPanel.styl';

/**
 * @class SegmentationMenuListHeader - Renders the header for the
 * SegmentationMenuList table.
 */
export default class SegmentationMenuListHeader extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const { importMetadata } = this.props;

    return (
      <div className="collectionListInfo">
        <table style={{ display: 'block' }}>
          <tbody>
            <tr>
              <td>Label:</td>
              <td>{importMetadata.label}</td>
            </tr>
            {importMetadata.type && (
              <>
                <tr>
                  <td>Type:</td>
                  <td>{importMetadata.type}</td>
                </tr>
                <tr>
                  <td>Modified:</td>
                  <td>{importMetadata.modified}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    );
  }
}
