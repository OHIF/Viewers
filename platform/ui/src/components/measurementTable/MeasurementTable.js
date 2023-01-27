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
import MeasurementSelect from './MeasurementSelect';
import MeasurementItem from './MeasurementItem';

function groupBy(list, props) {
  return list.reduce((a, b) => {
    (a[b[props]] = a[b[props]] || []).push(b);
    return a;
  }, {});
}

class MeasurementTable extends Component {
  static propTypes = {
    measurementCollection: PropTypes.array.isRequired,
    timepoints: PropTypes.array.isRequired,
    AllSRDisplaySets: PropTypes.array.isRequired,
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
  };

  static defaultProps = {
    overallWarnings: {
      warningList: [],
    },
    readOnly: false,
  };

  state = {
    selectedKey: null,
    selectedMeasurement: 0,
  };

  render() {
    const { overallWarnings, saveFunction, t } = this.props;
    const hasOverallWarnings = overallWarnings.warningList.length > 0;

    const measurementList = groupBy(
      this.props.measurementCollection[0].measurements,
      'srSeriesInstanceUID'
    );

    //Since for user added measurements/annotations, SeriesInstanceUID is not created until
    //the measurement is saved
    Object.defineProperty(measurementList, 'undefined', {
      enumerable: false,
    });

    function handleMeasurementChange(selectedOption) {
      for (const key in measurementList) {
        if (measurementList.hasOwnProperty(key)) {
          if (key === selectedOption.value) {
            measurementList[key].forEach(measurement => {
              measurement.isVisible = true;
              measurement.labels.forEach(label => (label.visible = true));
            });
          } else {
            measurementList[key].forEach(measurement => {
              measurement.isVisible = false;
              measurement.labels.forEach(label => (label.visible = false));
            });
          }
        }
      }
    }

    const measurementOptions = Object.keys(measurementList).map(
      (key, index) => {
        const sRDisplaySet = this.props.AllSRDisplaySets.filter(
          ele => ele.SeriesInstanceUID === key
        );
        return {
          value: key,
          title: sRDisplaySet[0].SeriesDescription,
          onClick: () => {
            const measurementIndex = Object.keys(measurementList).findIndex(
              elt => elt === key
            );
            this.setState({
              selectedMeasurement: measurementIndex,
            });
          },
        };
      }
    );

    return (
      <div className="measurementTable">
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
        </div>
        <div>
          <MeasurementSelect
            value={measurementOptions[this.state.selectedMeasurement]}
            formatOptionLabel={MeasurementItem}
            options={measurementOptions}
            onChange={handleMeasurementChange}
          />
        </div>
        <ScrollableArea>
          <div>
            {this.getMeasurementsGroups(
              measurementList[
                Object.keys(measurementList)[this.state.selectedMeasurement]
              ]
            )}
          </div>
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

  getMeasurementsGroups = currentMeasurement => {
    return (
      <TableList
        key={0}
        customHeader={this.getCustomHeader(currentMeasurement)}
      >
        {this.getMeasurements(currentMeasurement)}
      </TableList>
    );
  };

  getMeasurements = measureGroup => {
    const selectedKey = this.props.selectedMeasurementNumber
      ? this.props.selectedMeasurementNumber
      : this.state.selectedKey;
    return measureGroup.map((measurement, index) => {
      const key = measurement.measurementNumber;
      const itemIndex = index + 1;
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
        <div className="tableListHeaderTitle">{'Measurements'}</div>
        {measureGroup.maxMeasurements && (
          <div className="maxMeasurements">
            {this.props.t('MAX')} {measureGroup.maxMeasurements}
          </div>
        )}
        <div className="numberOfItems">{measureGroup.length}</div>
      </React.Fragment>
    );
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
