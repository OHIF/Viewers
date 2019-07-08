import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ThumbnailEntry } from './ThumbnailEntry';
import ThumbnailEntryDragSource from './ThumbnailEntryDragSource.js';
import './StudyBrowser.styl';

class StudyBrowser extends Component {
  static defaultProps = {
    studies: [],
    supportsDragAndDrop: true,
  };

  static propTypes = {
    studies: PropTypes.array.isRequired,
    supportsDragAndDrop: PropTypes.bool.isRequired,
    onThumbnailClick: PropTypes.func,
    onThumbnailDoubleClick: PropTypes.func,
  };

  render() {
    const studies = this.props.studies;

    const thumbnails = studies.map((study, studyIndex) => {
      return study.thumbnails.map((thumb, thumbIndex) => {
        if (this.props.supportsDragAndDrop) {
          return (
            <ThumbnailEntryDragSource
              key={`${studyIndex}_${thumbIndex}`}
              {...study}
              {...thumb}
              id={`${studyIndex}_${thumbIndex}`}
              onClick={this.props.onThumbnailClick}
              onDoubleClick={this.props.onThumbnailDoubleClick}
            />
          );
        } else {
          return (
            <div className="ThumbnailEntryContainer">
              <ThumbnailEntry
                key={`${studyIndex}_${thumbIndex}`}
                {...study}
                {...thumb}
                id={`${studyIndex}_${thumbIndex}`}
                onClick={this.props.onThumbnailClick}
                onDoubleClick={this.props.onThumbnailDoubleClick}
              />
            </div>
          );
        }
      });
    });

    const components = thumbnails.flat();
    return (
      <div className="StudyBrowser">
        <div className="scrollable-study-thumbnails">{components}</div>
      </div>
    );
  }
}

export { StudyBrowser };
