import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { StudiesItem } from './StudiesItem.js';
import './StudiesList.styl';

export class StudiesList extends Component {
  static propTypes = {
    class: PropTypes.string,
    studyListData: PropTypes.array.isRequired,
    onClick: PropTypes.func.isRequired,
    activeStudyInstanceUID: PropTypes.string,
  };

  render() {
    return (
      <div className={`studiesList ${this.props.class}`}>
        {this.getBrowserItems()}
      </div>
    );
  }

  getBrowserItems = () => {
    return this.props.studyListData.map((studyData, index) => {
      return (
        <StudiesItem
          key={index}
          studyData={studyData}
          active={
            studyData.StudyInstanceUID === this.props.activeStudyInstanceUID
          }
          onClick={event => this.props.onClick(studyData)}
        />
      );
    });
  };
}
