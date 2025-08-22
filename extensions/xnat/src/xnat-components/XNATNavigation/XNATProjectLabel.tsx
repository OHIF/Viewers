import React from 'react';



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
        {active ? (
          <h5 className="text-sm font-bold text-primary">{name}</h5>
        ) : (
          <h5 className="text-sm text-foreground">{name}</h5>
        )}
      </div>
    );
  }
}
