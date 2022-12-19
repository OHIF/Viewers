/* eslint-disable no-console */
import React from 'react';
import { _3DSegmentationApiClass } from './3DApi';
import Plot from 'react-plotly.js';
import * as Plotly from 'plotly.js';
import debounce from 'lodash.debounce';

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
    this.get3DShot = this.get3DShot.bind(this);
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
    /**
     * 1. is label from segmentation?  ^^
     * 2. How to select segmentation label   ^^
     * 3. Drop down to select the label ^^
     * 4. The background of plotly ^^
     * 5. An error boundary for the 3D ^^
     * 6. Cache the response for the label
     * 7. Cache implement for response
     */
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
      this.setState({ currentSegmentationLabel: segmentationLabels[1] });
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

  get3DShot() {
    // implementation
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

    // const localImageUrl = window.URL.createObjectURL(
    //   new Blob([response], { type: 'application/zip' })
    // );
    console.log('localImageUrl');
    console.log(response);
    console.log('localImageUrl----');

    localStorage.setItem(
      'print-chart',
      JSON.stringify({
        image: response,
      })
    );

    this.setState({
      currentImage: response,
    });

    // then(function(base64Str) {
    //   // if (this.state.currentImage)
    //   //   window.URL.revokeObjectURL(this.state.currentImage);

    //   // document.getElementById('jpg-export').src = base64Str;
    //   // return base64Str;
    // });
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
      <section
        style={{
          width: '95vw',
          height: '100%',
          padding: '20px',
          borderRadius: '8px',
          background: '#000000',
        }}
      >
        <h1
          style={{
            textAlign: 'left',
            margin: 0,
          }}
        >
          3D Morphology
        </h1>
        {this.state.loadingApp ? (
          <TextContainer title="Loading 3D Morphology Component. . ." />
        ) : (
          <>
            <nav
              className="hide-on-print"
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                overflowX: 'hidden',
                margin: '30px 0px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  columnGap: '10px',
                  width: 'fit-content',
                  alignItems: 'center',
                }}
              >
                {tabs.map(tab => (
                  <div
                    style={{
                      padding: '9px 15px',
                      color: `${
                        this.state.currentProperty === tab
                          ? '#00a4d9'
                          : '#6D6E72'
                      }`,
                      fontSize: '16px',
                      borderRadius: '50px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor:
                        this.state.currentProperty === tab
                          ? 'rgb(26, 28, 33)'
                          : 'transparent',
                    }}
                    onClick={this.changeProperty.bind(this, tab)}
                    key={tab}
                  >
                    {tab}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  rowGap: '10px',
                  justifyContent: 'start',
                }}
              >
                <select
                  style={{
                    padding: '5px 12px',
                    borderRadius: '13px',
                    fontSize: '15px',
                    backgroundColor: 'rgb(26, 28, 33)',
                    color: '#fff',
                  }}
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
                  style={{
                    fontSize: '15px',
                    color: '#a8a8a8',
                    fontStyle: 'bold',
                  }}
                  htmlFor="segmentation_labels"
                >
                  Segmentation Label
                </label>
              </div>
            </nav>
            <div
              className="hide-on-print"
              style={{ width: '90%', height: '600px' }}
            >
              {this.state.loadingGraph ? (
                <TextContainer title="Loading 3D. . ." />
              ) : !this.state.loadingGraph && this.state.segmentationError ? (
                <TextContainer title={this.state.segmentationError} />
              ) : (
                <Plot
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
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
