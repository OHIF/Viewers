import React from 'react';
import XNATProject from './XNATProject.js';

import '../XNATNavigationPanel.css';

export default class XNATProjectList extends React.Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const { projects } = this.props;

    if (projects.length < 1) {
      return null;
    }

    return (
      <>
        <h4>Other Projects</h4>
        {projects.map(project => (
          <li key={project.ID}>
            <XNATProject ID={project.ID} name={project.name} />
          </li>
        ))}
      </>
    );
  }
}
