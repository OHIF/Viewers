import React, { useState, useEffect } from 'react';
import { labelToSegmentNumberMap } from '../constants/labels';
import { Icon } from '@ohif/ui';
import PropTypes from 'prop-types';
import generateScreenShots from '../utils/generateScreenshots';
import './ResultsModal.css';

export default function ResultsModal({ measurements, imageIdPerMeasurement }) {
  const [indications, setIndications] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [screenShots, setScreenShots] = useState([]);

  debugger;

  // Calculate screenshots when you open the results modal.
  useEffect(() => {
    const fetchScreenshots = async () => {
      const imageScreenShots = await generateScreenShots(
        measurements,
        imageIdPerMeasurement
      );

      setScreenShots(imageScreenShots);
    };

    fetchScreenshots();
  }, []);

  return (
    <div>
      <MeasurementTable measurements={measurements} />
      <Screenshots screenShots={screenShots} />
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

function Screenshots({ screenShots }) {
  let items;

  if (!screenShots.length) {
    items = ['Loading...', 'Loading...', 'Loading...', 'Loading...'];
  } else {
    debugger;
    items = screenShots.map(screenshot => {
      const { image } = screenshot;
      return <img src={image} height="256px" width="256px"></img>;
    });

    while (items.length < 4) {
      items.push('');
    }
  }

  debugger;

  return (
    <div className="results-modal-screenshots-container">
      {items.map(item => (
        <div className="screenshot-item">{item}</div>
      ))}
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
