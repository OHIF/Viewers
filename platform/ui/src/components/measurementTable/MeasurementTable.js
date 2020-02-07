import './MeasurementTable.styl';

import React, { Component } from 'react';
import { withTranslation } from '../../contextProviders';

import { Icon } from './../../elements/Icon';
import { MeasurementTableItem } from './MeasurementTableItem.js';
import { OverlayTrigger } from './../overlayTrigger';
import PropTypes from 'prop-types';
import { ScrollableArea } from './../../ScrollableArea/ScrollableArea.js';
import { TableList } from './../tableList';
import { Tooltip } from './../tooltip';

class MeasurementTable extends Component {
  static propTypes = {
    measurementCollection: PropTypes.array.isRequired,
    timepoints: PropTypes.array.isRequired,
    overallWarnings: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
    onItemClick: PropTypes.func,
    onRelabelClick: PropTypes.func,
    onDeleteClick: PropTypes.func,
    onEditDescriptionClick: PropTypes.func,
    selectedMeasurementNumber: PropTypes.number,
    t: PropTypes.func,
    saveFunction: PropTypes.func,
    onSaveComplete: PropTypes.func,
    lesionTracker: PropTypes.bool,
  };

  static defaultProps = {
    overallWarnings: {
      warningList: [],
    },
    readOnly: false,
    lesionTracker: false,
  };

  state = {
    selectedKey: null,
  };

  render() {
    const { overallWarnings, saveFunction, t, lesionTracker } = this.props;
    const hasOverallWarnings = overallWarnings.warningList.length > 0;

    return (
      <div className={`measurementTable ${lesionTracker && 'lesionTracker'}`}>
        <div className="measurementTableHeader">
          {hasOverallWarnings && (
            <OverlayTrigger
              key={'overwall-warning'}
              placement="left"
              overlay={
                <Tooltip
                  placement="left"
                  className="in tooltip-warning"
                  id="tooltip-left"
                  style={{}}
                >
                  <div className="warningTitle">
                    {t('Criteria nonconformities')}
                  </div>
                  <div className="warningContent">
                    {this.getWarningContent()}
                  </div>
                </Tooltip>
              }
            >
              <span className="warning-status">
                <span className="warning-border">
                  <Icon name="exclamation-triangle" />
                </span>
              </span>
            </OverlayTrigger>
          )}
          {this.getTimepointsHeader()}
        </div>
        <ScrollableArea>
          <div>{this.getMeasurementsGroups()}</div>
        </ScrollableArea>
        <div className="measurementTableFooter">
          {saveFunction && (
            <button
              onClick={this.saveFunction}
              className="saveBtn"
              data-cy="save-measurements-btn"
            >
              <Icon name="save" width="14px" height="14px" />
              Save measurements
            </button>
          )}
        </div>
      </div>
    );
  }

  saveFunction = async event => {
    const { saveFunction, onSaveComplete } = this.props;
    if (saveFunction) {
      try {
        const result = await saveFunction();
        if (onSaveComplete) {
          onSaveComplete({
            title: 'STOW SR',
            message: result.message,
            type: 'success',
          });
        }
      } catch (error) {
        if (onSaveComplete) {
          onSaveComplete({
            title: 'STOW SR',
            message: error.message,
            type: 'error',
          });
        }
      }
    }
  };

  getMeasurementsGroups = () => {
    return this.props.measurementCollection.map((measureGroup, index) => {
      return (
        <TableList
          key={index}
          customHeader={this.getCustomHeader(measureGroup)}
        >
          {this.getMeasurements(measureGroup)}
        </TableList>
      );
    });
  };

  getMeasurements = measureGroup => {
    const selectedKey = this.props.selectedMeasurementNumber
      ? this.props.selectedMeasurementNumber
      : this.state.selectedKey;
    return measureGroup.measurements.map((measurement, index) => {
      const key = measurement.measurementNumber;
      const itemIndex = measurement.itemNumber || index + 1;
      const itemClass =
        selectedKey === key && !this.props.readOnly ? 'selected' : '';

      return (
        <MeasurementTableItem
          key={key}
          itemIndex={itemIndex}
          itemClass={itemClass}
          measurementData={measurement}
          onItemClick={this.onItemClick}
          onRelabel={this.props.onRelabelClick}
          onDelete={this.props.onDeleteClick}
          onEditDescription={this.props.onEditDescriptionClick}
        />
      );
    });
  };

  onItemClick = (event, measurementData) => {
    if (this.props.readOnly) return;

    this.setState({
      selectedKey: measurementData.measurementNumber,
    });

    if (this.props.onItemClick) {
      this.props.onItemClick(event, measurementData);
    }
  };

  getCustomHeader = measureGroup => {
    return (
      <React.Fragment>
        {measureGroup.selectorAction && (
          <div
            className="tableListHeaderSelector"
            onClick={measureGroup.selectorAction}
          >
            <svg viewBox="0 0 12 13">
              <path d="M6.5 7L6.5 12C6.5 12.28 6.28 12.5 6 12.5 5.72 12.5 5.5 12.28 5.5 12L5.5 7 0.5 7C0.22 7 0 6.78 0 6.5 0 6.22 0.22 6 0.5 6L5.5 6 5.5 1C5.5 0.72 5.72 0.5 6 0.5 6.28 0.5 6.5 0.72 6.5 1L6.5 6 11.5 6C11.78 6 12 6.22 12 6.5 12 6.78 11.78 7 11.5 7L6.5 7Z" id="Combined-Shape"></path>
            </svg>
          </div>
        )}
        <div className="tableListHeaderTitle">
          {this.props.t(measureGroup.groupName)}
        </div>
        {measureGroup.maxMeasurements && (
          <div className="maxMeasurements">
            {this.props.t('MAX')} {measureGroup.maxMeasurements}
          </div>
        )}
        <div className="numberOfItems">{measureGroup.measurements.length}</div>
      </React.Fragment>
    );
  };

  getTimepointsHeader = () => {
    const { timepoints, t, lesionTracker } = this.props;

    return timepoints.map((timepoint, index) => {
      return (
        <div key={index} className="measurementTableHeaderItem">
          <div className="timepointLabel">{t(timepoint.key)}</div>
          <div className="timepointDate">{timepoint.date}</div>
          {lesionTracker && timepoints.length > 1 && index === 0 && (
            <div className="caseProgressContainer">
              <form className="caseProgress" data-key="">
                <div className="radialProgress">
                  <svg
                    id="svg"
                    width="26"
                    height="26"
                    viewport="0 0 26 26"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      r="11"
                      cx="13"
                      cy="13"
                      fill="transparent"
                      strokeDasharray="69.11503837897544"
                      strokeDashoffset="0"
                    ></circle>
                    <circle
                      id="bar"
                      r="11"
                      cx="13"
                      cy="13"
                      fill="transparent"
                      strokeDasharray="69.11503837897544"
                      style={{ strokeDashoffset: '69.11503837897544px' }}
                    ></circle>
                  </svg>
                  <div className="progressArea">1</div>
                </div>
              </form>
            </div>
          )}
        </div>
      );
    });
  };

  getWarningContent = () => {
    const { warningList = '' } = this.props.overallWarnings;

    if (Array.isArray(warningList)) {
      const listedWarnings = warningList.map((warn, index) => {
        return <li key={index}>{warn}</li>;
      });

      return <ol>{listedWarnings}</ol>;
    } else {
      return <React.Fragment>{warningList}</React.Fragment>;
    }
  };
}

const connectedComponent = withTranslation(['MeasurementTable', 'Common'])(
  MeasurementTable
);
export { connectedComponent as MeasurementTable };
export default connectedComponent;
