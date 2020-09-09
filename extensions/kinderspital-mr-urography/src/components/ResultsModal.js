import React, { useState } from 'react';
import { labelToSegmentNumberMap } from '../constants/labels';
import { Icon } from '@ohif/ui';
import PropTypes from 'prop-types';
import './ResultsModal.css';

export default function ResultsModal({
  measurements,
  onGeneratePDFReportClick,
}) {
  debugger;

  const [indications, setIndications] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  return (
    <div>
      <MeasurementTable measurements={measurements}></MeasurementTable>
      <TextInputLarge
        type="text"
        value={indications}
        id={'results-modal-diagnosis'}
        label={'Indications'}
        onChange={evt => {
          setIndications(event.target.value);
        }}
      />
      <TextInputLarge
        type="text"
        value={diagnosis}
        id={'results-modal-diagnosis'}
        label={'Diagnosis'}
        onChange={evt => {
          setDiagnosis(event.target.value);
        }}
      />

      <button
        onClick={() => {
          onGeneratePDFReportClick(indications, diagnosis);
        }}
        className="results-modal-footer-button"
      >
        <Icon name="save" width="14px" height="14px" />
        Generate PDF Report
      </button>
    </div>
  );
}

class TextInputLarge extends React.Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.string,
    label: PropTypes.string,
    type: PropTypes.string,
  };

  static defaultProps = {
    value: '',
    id: `TextInput-${new Date().toTimeString()}`,
    label: undefined,
    type: 'text',
  };

  render() {
    return (
      <div className="results-modal-input-container">
        <div>
          {this.props.label && (
            <label className="input-ohif-label" htmlFor={this.props.id}>
              {this.props.label}
            </label>
          )}
        </div>
        <div>
          <textarea
            type={this.props.type}
            id={this.props.id}
            className="form-control input-ohif"
            {...this.props}
          />
        </div>
      </div>
    );
  }
}

function MeasurementTable({ measurements }) {
  const meausrementItems = measurements.map(m => {
    return { region: m.label, auc: m.areaUnderCurve, volume: m.volume };
  });

  meausrementItems.sort((a, b) => {
    const val =
      labelToSegmentNumberMap[a.region] - labelToSegmentNumberMap[b.region];

    return val;
  });

  return (
    <table className="results-modal-table">
      <tbody>
        <tr>
          <th>Region</th>
          <th>Area Under Curve</th>
          <th>Volume (ml)</th>
        </tr>
        {meausrementItems.map(item => (
          <tr>
            <td>{item.region}</td>
            <td>{Number(item.auc).toFixed(1)}</td>
            <td>{item.volume}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
