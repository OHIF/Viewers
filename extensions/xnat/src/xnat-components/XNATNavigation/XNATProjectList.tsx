import React from 'react';
import XNATProject from './XNATProject';

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
        {projects.map(project => {
          return (
            <div key={project.ID} className="mb-2">
              <XNATProject ID={project.ID} name={project.name} />
            </div>
          );
        })}
      </React.Fragment>
    );
  }
} 