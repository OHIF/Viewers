import React from 'react';
import XNATProject from './XNATProject';

import '../XNATNavigationPanel.css';

interface Project {
  ID: string;
  name: string;
  [key: string]: any;
}

interface XNATProjectListProps {
  projects: Project[];
}

export default class XNATProjectList extends React.Component<XNATProjectListProps> {
  constructor(props: XNATProjectListProps) {
    super(props);
  }

  render(): React.ReactNode {
    const { projects } = this.props;

    if (projects.length < 1) {
      return null;
    }

    return (
      <React.Fragment>
        <h4>Other Projects</h4>
        {projects.map(project => {
          return (
            <li key={project.ID}>
              <XNATProject ID={project.ID} name={project.name} />
            </li>
          );
        })}
      </React.Fragment>
    );
  }
} 