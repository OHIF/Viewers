import React from 'react';

import { Icon } from '@ohif/ui';

interface XNATSessionLabelProps {
  ID: string;
  label: string;
  active: boolean;
  shared: boolean;
  parentProjectId: string;
  hasRois: boolean;
  maskCount: number;
  contourCount: number;
}

export default class XNATSessionLabel extends React.Component<XNATSessionLabelProps> {
  constructor(props: XNATSessionLabelProps) {
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
        <React.Fragment>
          <h5 className="text-sm font-bold text-primary">{label}</h5>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <h5 className="text-sm text-foreground">{label}</h5>
      </React.Fragment>
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
      return <React.Fragment>...</React.Fragment>;
    }

    return (
      <React.Fragment>
        <h6 className="flex items-center text-xs text-muted-foreground">
          {contourCount ? (
            <React.Fragment>
              <Icon name="circle" className="mr-1" />
              {` ${contourCount}  `}
            </React.Fragment>
          ) : null}
          {maskCount ? (
            <React.Fragment>
              <Icon name="square" />
              {` ${maskCount} `}
            </React.Fragment>
          ) : null}
        </h6>
      </React.Fragment>
    );
  }

  render() {
    const { shared, parentProjectId } = this.props;

    const sharedLabel = shared ? (
      <React.Fragment>
        <h6 className="text-xs text-muted-foreground italic">{`Shared from ${parentProjectId}`}</h6>
      </React.Fragment>
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
