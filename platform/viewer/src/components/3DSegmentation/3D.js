/* eslint-disable no-console */
import React from 'react';
import { _3DSegmentationApiClass } from './3DApi';
import Plot from 'react-plotly.js';
import * as Plotly from 'plotly.js';
import debounce from 'lodash.debounce';
import './3d.css';

class Morphology3DComponent extends React.Component {
  constructor(props) {
    super();
    this.state = {
      currentImage: '',
      segmentationData: null,
      segmentationError: '',
      loadingApp: false,
      loadingGraph: false,
      properties: [],
      currentProperty: '',
      graph: null,
      segmentationLabels: [],
      currentSegmentationLabel: '',
      series_uid: '',
    };
    this.graphRef = React.createRef(null);
    // Function binds
    this.getImage = this.getImage.bind(this);
    this.changeProperty = this.changeProperty.bind(this);
    this.changeSegmentationLabel = this.changeSegmentationLabel.bind(this);
    this.loadSegmentations = this.loadSegmentations.bind(this);
    this.load3DData = this.load3DData.bind(this);
  }

  async componentDidMount() {
    this.setState({ loadingApp: true });
    const series_uid = JSON.parse(localStorage.getItem('series_uid'));
    this.setState({ series_uid });
    await this.loadSegmentations(series_uid);
    this.setState({ loadingApp: false });
  }

  async componentDidUpdate(_, state) {
    if (
      state.currentSegmentationLabel !== this.state.currentSegmentationLabel
    ) {
      const { currentSegmentationLabel, series_uid } = this.state;
      if (currentSegmentationLabel && series_uid) {
        const { currentSegmentationLabel, series_uid } = this.state;
        this.setState({ loadingGraph: true });
        await this.load3DData(currentSegmentationLabel, series_uid);
      }
    }
    if (state.currentProperty !== this.state.currentProperty) {
      if (this.state.segmentationData && this.state.currentProperty) {
        const graph = _3DSegmentationApiClass.decompressSegmentation(
          this.state.segmentationData[this.state.currentProperty]
        );
        this.setState({ graph });
        this.setState({ segmentationError: null });
        this.setState({ loadingGraph: false });
      }
    }
  }

  loadSegmentations = async series_uid => {
    try {
      // Implement Caching
      const segmentationLabels = await _3DSegmentationApiClass.get3DLabels(
        series_uid
      );
      this.setState({ segmentationLabels });
      const currentSegmentationLabel = segmentationLabels[1];
      this.setState({ currentSegmentationLabel: segmentationLabels[1] });
      // await this.load3DData(currentSegmentationLabel, series_uid);
    } catch (error) {
      // handle getting segmentation error
    }
  };

  load3DData = async (label, series_uid) => {
    try {
      // Implement Caching
      const segmentationData = await _3DSegmentationApiClass.get3DSegmentationData(
        {
          series_uid,
          label,
        }
      );
      const segmentationProperties = Object.keys(segmentationData);
      this.setState({ properties: segmentationProperties });
      this.setState({ currentProperty: segmentationProperties[0] }); // view first property
      this.setState({ segmentationData });
    } catch (error) {
      this.setState({ segmentationError: error.message });
      this.setState({ segmentationData: null });
    } finally {
      this.setState({ loadingGraph: false });
    }
  };

  changeProperty(property) {
    if (property) {
      this.setState({ currentProperty: property });
    }
  }

  changeSegmentationLabel(e) {
    const selectedSegmentationLabel = e.target.value;
    this.setState({ currentSegmentationLabel: selectedSegmentationLabel });
  }

  async getImage() {
    const customScene = this.graphRef.current.el.layout.scene;

    const plotDiv = this.graphRef.current.el;
    const { graphDiv } = plotDiv._fullLayout.scene._scene;
    console.log(this.graphRef.current);
    const divToDownload = {
      ...graphDiv,
      layout: { ...graphDiv.layout, scene: customScene },
    };
    const response = await Plotly.toImage(divToDownload, {
      format: 'png',
      width: 800,
      height: 600,
    });

    localStorage.setItem(
      'print-chart',
      JSON.stringify({
        image: response,
      })
    );

    this.setState({
      currentImage: response,
    });
  }

  onPlotlyUpdate = figure => {
    debounce(this.getImage, {
      delay: 5000,
    });
  };

  render() {
    const tabs = this.state.properties;
    const { segmentationLabels } = this.state;
    const TextContainer = ({ title }) => (
      <span
        style={{
          fontSize: '15px',
          color: '#fff',
          textAlign: 'center',
          margin: '20px 0',
          display: 'block',
        }}
      >
        {title}
      </span>
    );

    return (
      <section className="morphology-section">
        <h1 className="morphology-heading">3D Morphology</h1>
        {this.state.loadingApp ? (
          <TextContainer title="Loading 3D Morphology Component. . ." />
        ) : (
          <>
            <nav className="hide-on-print morphology-nav">
              <div className="morphology-tab-container">
                {tabs.map(tab => (
                  <div
                    className={`morphology-tab ${
                      this.state.currentProperty === tab ? 'active' : ''
                    }`}
                    onClick={this.changeProperty.bind(this, tab)}
                    key={tab}
                  >
                    {tab}
                  </div>
                ))}
              </div>
              <div className="morphology-select-container">
                <select
                  className="morphology-select"
                  id="segmentation_labels"
                  name="SegmentationLabels"
                  onChange={this.changeSegmentationLabel}
                  value={this.state.currentSegmentationLabel}
                >
                  <option disabled value="none">
                    select a label
                  </option>
                  {segmentationLabels.map((label, idx) => (
                    <option key={idx}>{label}</option>
                  ))}
                </select>
                <label
                  className="morphology-select-label"
                  htmlFor="segmentation_labels"
                >
                  Segmentation Label
                </label>
              </div>
            </nav>
            <div className="hide-on-print morphology-plot-container">
              {this.state.loadingGraph ? (
                <TextContainer title="Loading 3D. . ." />
              ) : !this.state.loadingGraph && this.state.segmentationError ? (
                <TextContainer title={this.state.segmentationError} />
              ) : (
                <Plot
                  className="morphology-plot"
                  data={[
                    {
                      ...this.state.graph,
                    },
                  ]}
                  layout={{
                    paper_bgcolor: '#000',
                    font: { color: '#ffffff', size: '14px' },
                  }}
                  // onInitialized={this.getImage}
                  // onUpdate={this.getImage}
                  config={{ displaylogo: false, responsive: true }}
                  ref={this.graphRef}
                />
              )}
            </div>
          </>
        )}
      </section>
    );
  }
}

export { Morphology3DComponent };
