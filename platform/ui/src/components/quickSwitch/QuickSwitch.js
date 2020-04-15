import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { StudiesList } from './StudiesList.js';
import { ScrollableArea } from './../../ScrollableArea/ScrollableArea.js';
import { SeriesList } from './SeriesList.js';

import './QuickSwitch.styl';

export class QuickSwitch extends Component {
  static propTypes = {
    side: PropTypes.string,
    studyListData: PropTypes.array.isRequired,
    onSeriesSelected: PropTypes.func.isRequired,
    seriesData: PropTypes.array,
    onStudySelected: PropTypes.func,
    activeStudyInstanceUID: PropTypes.string,
    activeDisplaySetInstanceUID: PropTypes.string,
  };

  constructor(props) {
    super(props);

    this.state = {
      seriesQuickSwitchOpen: false,
      sideClass: this.props.side || '',
      activeStudyInstanceUID: this.props.activeStudyInstanceUID,
      activeDisplaySetInstanceUID: this.props.activeDisplaySetInstanceUID,
    };
  }

  componentDidUpdate(prevProps) {
    const props = this.props;

    if (props.activeStudyInstanceUID !== prevProps.activeStudyInstanceUID) {
      this.setState({
        activeStudyInstanceUID: props.activeStudyInstanceUID,
      });
    }

    if (
      props.activeDisplaySetInstanceUID !==
      prevProps.activeDisplaySetInstanceUID
    ) {
      this.setState({
        activeDisplaySetInstanceUID: props.activeDisplaySetInstanceUID,
      });
    }
  }

  render() {
    const quickSwitchClass = this.state.seriesQuickSwitchOpen
      ? 'series-triggered'
      : '';

    return (
      <div
        className={`series-quick-switch clearfix noselect ${this.state.sideClass} ${quickSwitchClass}`}
        onMouseLeave={this.hideSeriesSwitch}
      >
        <div className="series-switch" onMouseEnter={this.showSeriesSwitch}>
          <div className="title-label">Series</div>
          <div className="series-box">
            {this.getSmallListItems()}
            <ScrollableArea scrollStep={201} class="series-browser">
              <SeriesList
                seriesItems={this.getSeriesItems()}
                onClick={this.onSeriesClick}
                activeDisplaySetInstanceUID={
                  this.state.activeDisplaySetInstanceUID
                }
              />
            </ScrollableArea>
          </div>
        </div>
        <div className="study-switch">
          <div className="title-label">Study</div>
          <div className="study-box">
            <ScrollableArea scrollStep={91} class="study-browser">
              <StudiesList
                studyListData={this.props.studyListData}
                onClick={this.onStudyClick}
                activeStudyInstanceUID={this.state.activeStudyInstanceUID}
              />
            </ScrollableArea>
          </div>
        </div>
      </div>
    );
  }

  getSeriesItems = () => {
    let seriesData;

    if (this.props.seriesData) {
      seriesData = this.props.seriesData;
    } else if (this.state.activeStudyInstanceUID) {
      const study = this.props.studyListData.find(
        study => study.StudyInstanceUID === this.state.activeStudyInstanceUID
      );

      seriesData = study.thumbnails;
    } else {
      seriesData = this.props.studyListData[0].thumbnails;
    }

    return seriesData || [];
  };

  getSmallListItems = () => {
    const seriesItems = this.getSeriesItems() || [];
    return seriesItems.map((seriesData, index) => {
      const active =
        seriesData.displaySetInstanceUID ===
        this.state.activeDisplaySetInstanceUID;
      return (
        <div key={index} className={`series-item ${active ? 'active' : ''}`} />
      );
    });
  };

  onStudyClick = studyDataSelected => {
    if (this.props.onStudySelected) {
      this.props.onStudySelected(studyDataSelected);
    }
    this.setState({
      activeStudyInstanceUID: studyDataSelected.StudyInstanceUID,
      seriesQuickSwitchOpen: true,
    });
  };

  onSeriesClick = seriesDataSelected => {
    this.setState({
      activeDisplaySetInstanceUID: seriesDataSelected.displaySetInstanceUID,
    });

    this.props.onSeriesSelected(seriesDataSelected);
  };

  showSeriesSwitch = () => {
    this.setState({
      seriesQuickSwitchOpen: true,
    });
  };

  hideSeriesSwitch = () => {
    this.setState({
      seriesQuickSwitchOpen: false,
    });
  };
}
