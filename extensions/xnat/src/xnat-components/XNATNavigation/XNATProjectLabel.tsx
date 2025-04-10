import React from 'react';

import '../XNATNavigationPanel.css';

interface XNATProjectLabelProps {
  ID: string;
  name: string;
  active: boolean;
}

export default class XNATProjectLabel extends React.Component<XNATProjectLabelProps> {
  constructor(props: XNATProjectLabelProps) {
    super(props);
  }

  render() {
    const { active, name } = this.props;

    return (
      <div>
        {active ? <h5 className="xnat-nav-active">{name}</h5> : <h5>{name}</h5>}
      </div>
    );
  }
}
