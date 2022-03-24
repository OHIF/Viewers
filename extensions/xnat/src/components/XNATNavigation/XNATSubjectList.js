import React from 'react';
import XNATSubject from './XNATSubject.js';

import '../XNATNavigationPanel.css';

export default class XNATSubjectList extends React.Component {
  constructor(props = {}) {
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
