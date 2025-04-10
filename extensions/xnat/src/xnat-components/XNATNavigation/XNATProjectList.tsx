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
    console.log('XNATProjectList: Constructor called with projects:', props.projects);
  }

  render(): React.ReactNode {
    const { projects } = this.props;
    console.log('XNATProjectList: Rendering with projects:', projects);

    if (projects.length < 1) {
      console.log('XNATProjectList: No projects to display');
      return null;
    }

    return (
      <React.Fragment>
        <h4>Other Projects</h4>
        {projects.map(project => {
          console.log('XNATProjectList: Rendering project:', project);
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