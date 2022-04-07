import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Thumbnail } from './../studyBrowser';
import './SeriesList.styl';

export class SeriesList extends Component {
  static propTypes = {
    seriesItems: PropTypes.array.isRequired,
    onClick: PropTypes.func.isRequired,
    activeDisplaySetInstanceUID: PropTypes.string,
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
        <Thumbnail
          key={seriesData.displaySetInstanceUID}
          id={`series_thumb_${index}`}
          {...seriesData}
          active={
            seriesData.displaySetInstanceUID ===
            this.props.activeDisplaySetInstanceUID
          }
          onClick={() => this.props.onClick(seriesData)}
        />
      );
    });
  };
}
