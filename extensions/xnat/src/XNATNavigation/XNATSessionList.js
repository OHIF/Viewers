import React from 'react';
import XNATSession from './XNATSession.js';

import '../XNATNavigationPanel.css';

export default class XNATSessionList extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      projectId,
      parentProjectId,
      subjectId,
      sessions,
      fetched,
    } = this.props;

    if (fetched) {
      return (
        <ul>
          {sessions.map(session => (
            <li className="xnat-nav-session-item" key={session.ID}>
              <XNATSession
                ID={session.ID}
                label={session.label}
                projectId={projectId}
                parentProjectId={parentProjectId}
                subjectId={subjectId}
              />
            </li>
          ))}
        </ul>
      );
    }

    return (
      <ul>
        <li key={`${subjectId} loading`}>
          <i className="fa fa-spin fa-circle-o-notch fa-fw" />
        </li>
      </ul>
    );
  }
}
