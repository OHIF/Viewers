import React from 'react';
import XNATProjectLabel from './XNATProjectLabel.js';
import XNATSubjectList from './XNATSubjectList.js';
import fetchJSON from '../../utils/IO/fetchJSON.js';
import onExpandIconClick from './helpers/onExpandIconClick.js';
import getExpandIcon from './helpers/getExpandIcon.js';
import compareOnProperty from './helpers/compareOnProperty.js';
import sessionMap from '../../utils/sessionMap';

import '../XNATNavigationPanel.css';

export default class XNATProject extends React.Component {
  constructor(props = {}) {
    super(props);

    const active = this.props.ID === sessionMap.getProject();

    this.state = {
      subjects: [],
      active,
      expanded: false,
      fetched: false,
    };

    this.getExpandIcon = getExpandIcon.bind(this);
    this.onExpandIconClick = onExpandIconClick.bind(this);
  }

  componentWillUnmount() {
    if (this._cancelablePromise) {
      this._cancelablePromise.cancel();
    }
  }

  /**
   * fetchData - Fetch this project's list of subjects from from XNAT.
   *
   * @returns {null}
   */
  fetchData() {
    this._cancelablePromise = fetchJSON(
      `data/archive/projects/${this.props.ID}/subjects?format=json`
    );

    this._cancelablePromise.promise
      .then(result => {
        if (!result) {
          return;
        }

        const subjects = result.ResultSet.Result;

        subjects.sort((a, b) => compareOnProperty(a, b, 'label'));

        this.setState({
          subjects,
          fetched: true,
        });
      })
      .catch(err => console.log(err));
  }

  render() {
    const { ID, name } = this.props;
    const { subjects, active, fetched } = this.state;

    return (
      <>
        <div className="xnat-nav-horizontal-box">
          <a
            className="btn btn-sm btn-secondary"
            onClick={this.onExpandIconClick}
          >
            {this.getExpandIcon()}
          </a>
          <XNATProjectLabel ID={ID} name={name} active={active} />
        </div>
        {this.state.expanded ? (
          <XNATSubjectList
            projectId={ID}
            subjects={subjects}
            fetched={fetched}
          />
        ) : null}
      </>
    );
  }
}
