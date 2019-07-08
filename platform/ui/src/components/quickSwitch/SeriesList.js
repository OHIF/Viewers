import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { ThumbnailEntry } from './../studyBrowser';
import './SeriesList.styl';

export class SeriesList extends Component {
  static propTypes = {
    seriesItems: PropTypes.array.isRequired,
    onClick: PropTypes.func.isRequired,
    activeDisplaySetInstanceUid: PropTypes.string,
  };

  render() {
    return (
      <React.Fragment>
        <div className="study-browser-series clearfix thumbnails-wrapper">
          <div className="study-series-container">{this.getSeriesItems()}</div>
        </div>
      </React.Fragment>
    );
  }

  getSeriesItems = () => {
    return this.props.seriesItems.map((seriesData, index) => {
      return (
        <ThumbnailEntry
          key={seriesData.displaySetInstanceUid}
          id={`series_thumb_${index}`}
          {...seriesData}
          active={
            seriesData.displaySetInstanceUid ===
            this.props.activeDisplaySetInstanceUid
          }
          onClick={() => this.props.onClick(seriesData)}
        />
      );
    });
  };
}
