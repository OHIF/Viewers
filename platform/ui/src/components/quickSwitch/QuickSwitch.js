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
    seriesListData: PropTypes.array,
    onStudySelected: PropTypes.func,
    activeStudyInstanceUid: PropTypes.string,
    activeDisplaySetInstanceUid: PropTypes.string,
  };

  constructor(props) {
    super(props);

    this.state = {
      seriesQuickSwitchOpen: false,
      sideClass: this.props.side || '',
      activeStudyInstanceUid: this.props.activeStudyInstanceUid,
      activeDisplaySetInstanceUid: this.props.activeDisplaySetInstanceUid,
    };
  }

  componentDidUpdate(prevProps) {
    const props = this.props;

    if (props.activeStudyInstanceUid !== prevProps.activeStudyInstanceUid) {
      this.setState({
        activeStudyInstanceUid: props.activeStudyInstanceUid,
      });
    }

    if (
      props.activeDisplaySetInstanceUid !==
      prevProps.activeDisplaySetInstanceUid
    ) {
      this.setState({
        activeDisplaySetInstanceUid: props.activeDisplaySetInstanceUid,
      });
    }
  }

  render() {
    const quickSwitchClass = this.state.seriesQuickSwitchOpen
      ? 'series-triggered'
      : '';

    return (
      <div
        className={`series-quick-switch clearfix noselect ${
          this.state.sideClass
        } ${quickSwitchClass}`}
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
                activeDisplaySetInstanceUid={
                  this.state.activeDisplaySetInstanceUid
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
                activeStudyInstanceUid={this.state.activeStudyInstanceUid}
              />
            </ScrollableArea>
          </div>
        </div>
      </div>
    );
  }

  getSeriesItems = () => {
    let seriesListData;

    if (this.props.seriesListData) {
      seriesListData = this.props.seriesListData;
    } else if (this.state.activeStudyInstanceUid) {
      const study = this.props.studyListData.find(
        study => study.studyInstanceUid === this.state.activeStudyInstanceUid
      );

      seriesListData = study.thumbnails;
    } else {
      seriesListData = this.props.studyListData[0].thumbnails;
    }

    return seriesListData || [];
  };

  getSmallListItems = () => {
    const seriesItems = this.getSeriesItems() || [];
    return seriesItems.map((seriesData, index) => {
      const active =
        seriesData.displaySetInstanceUid ===
        this.state.activeDisplaySetInstanceUid;
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
      activeStudyInstanceUid: studyDataSelected.studyInstanceUid,
      seriesQuickSwitchOpen: true,
    });
  };

  onSeriesClick = seriesDataSelected => {
    this.setState({
      activeDisplaySetInstanceUid: seriesDataSelected.displaySetInstanceUid,
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
