import React from 'react';

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
          <h5 className="text-sm font-bold text-primary">{label}</h5>
        ) : (
          <h5 className="text-sm text-foreground">{label}</h5>
        )}
        {shared ? (
          <h6 className="text-xs text-muted-foreground italic">{`Shared from ${parentProjectId}`}</h6>
        ) : null}
      </div>
    );
  }
}
