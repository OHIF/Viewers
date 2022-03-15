import React from 'react';

import '../XNATNavigationPanel.css';
import { Icon } from '@ohif/ui';

export default class XNATSessionLabel extends React.Component {
  constructor(props) {
    super(props);
  }

  /**
   * _headerLabel - Returns a JSX component for the header.
   *
   * @returns {Object} The JSX component.
   */
  _headerLabel() {
    const { label, ID, active } = this.props;

    if (active) {
      return (
        <>
          <h5 className="xnat-nav-active">{label}</h5>
        </>
      );
    }

    return (
      <>
        <h5>{label}</h5>
      </>
    );
  }

  /**
   * _roiCollectionCountLabel - Returns the label of ROI Collection counts.
   *
   * @returns {React.component} The component.
   */
  _roiCollectionCountLabel() {
    const { contourCount, maskCount, hasRois } = this.props;

    if (!hasRois) {
      return null;
    }

    // Render loading dialog.
    if (!contourCount && !maskCount) {
      return <>...</>;
    }

    return (
      <>
        <h6 className="xnat-navigation-tree-roi-label">
          {contourCount ? (
            <>
              <Icon name="xnat-contour" className="xnat-navigation-tree-roi-icon" />
              {` ${contourCount}  `}
            </>
          ) : null}
          {maskCount ? (
            <>
              <Icon name="xnat-mask" />
              {` ${maskCount} `}
            </>
          ) : null}
        </h6>
      </>
    );
  }

  render() {
    const { shared, parentProjectId } = this.props;

    const sharedLabel = shared ? (
      <>
        <h6 className="xnat-nav-shared">{`Shared from ${parentProjectId}`}</h6>
      </>
    ) : null;

    return (
      <div>
        {this._headerLabel()}
        {this._roiCollectionCountLabel()}
        {sharedLabel}
      </div>
    );
  }
}
