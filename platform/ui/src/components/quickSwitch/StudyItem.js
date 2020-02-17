import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './StudyItem.styl';

export class StudyItem extends Component {
  static propTypes = {
    onClick: PropTypes.func.isRequired,
    studyData: PropTypes.shape({
      studyDate: PropTypes.string,
      studyDescription: PropTypes.string,
      modalities: PropTypes.string,
      studyAvailable: PropTypes.bool,
    }),
    active: PropTypes.bool,
  };

  render() {
    const {
      studyDate,
      studyDescription,
      modalities,
      studyAvailable,
    } = this.props.studyData;
    const activeClass = this.props.active ? ' active' : '';
    const hasDescriptionAndDate = studyDate && studyDescription;
    return (
      <div
        className={`studyBrowseItem${activeClass}`}
        onClick={this.props.onClick}
      >
        <div className="studyItemBox">
          <div className="studyModality">
            <div className="studyModalityText">{modalities}</div>
          </div>
          <div className="studyText">
            {hasDescriptionAndDate ? (
              <React.Fragment>
                <div className="studyDate">{studyDate}</div>
                <div className="studyDescription">{studyDescription}</div>
              </React.Fragment>
            ) : (
              <div className="studyAvailability">
                {studyAvailable ? (
                  <React.Fragment>N/A</React.Fragment>
                ) : (
                  <React.Fragment>Click to load</React.Fragment>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
