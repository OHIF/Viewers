import React from 'react';
import XNATSubject from './XNATSubject';

import '../XNATNavigationPanel.css';

interface Subject {
  ID: string;
  label: string;
  project: string;
  [key: string]: any;
}

interface XNATSubjectListProps {
  subjects: Subject[];
  projectId: string;
  fetched: boolean;
}

export default class XNATSubjectList extends React.Component<XNATSubjectListProps> {
  constructor(props: XNATSubjectListProps) {
    super(props);
  }

  render() {
    const { subjects, projectId, fetched } = this.props;

    if (fetched) {
      return (
        <ul>
          {subjects.map(subject => (
            <li key={subject.ID}>
              <XNATSubject
                label={subject.label}
                ID={subject.ID}
                parentProjectId={subject.project}
                projectId={projectId}
              />
            </li>
          ))}
        </ul>
      );
    }

    return (
      <ul>
        <li key={`${projectId} loading`}>
          <i className="fa fa-spin fa-circle-o-notch fa-fw" />
        </li>
      </ul>
    );
  }
}
