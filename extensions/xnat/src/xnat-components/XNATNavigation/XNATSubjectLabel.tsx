import React from 'react';

import '../XNATNavigationPanel.css';

interface XNATSubjectLabelProps {
  ID: string;
  label: string;
  active: boolean;
  shared: boolean;
  parentProjectId: string;
}

export default class XNATSubjectLabel extends React.Component<XNATSubjectLabelProps> {
  constructor(props: XNATSubjectLabelProps) {
    super(props);
  }

  render() {
    const { ID, label, active, shared, parentProjectId } = this.props;

    let sharedLabel = shared ? (
      <h6 className="xnat-nav-shared">{`Shared from ${parentProjectId}`}</h6>
    ) : null;

    return (
      <div>
        {active ? (
          <h5 className="xnat-nav-active">{label}</h5>
        ) : (
          <h5>{label}</h5>
        )}
        {sharedLabel}
      </div>
    );
  }
}
