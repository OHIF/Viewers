/* eslint-disable no-console */
import React, { useState, useEffect, useRef } from 'react';
import { _3DSegmentationApiClass } from './3DApi';
import Plot from 'react-plotly.js';
import * as Plotly from 'plotly.js';
import debounce from 'lodash.debounce';
import './3d.css';

const Morphology3DComponent = React.forwardRef((props, ref) => {
  const [currentImage, setCurrentImage] = useState('');
  const [segmentationData, setSegmentationData] = useState(null);
  const [segmentationError, setSegmentationError] = useState('');
  const [loadingApp, setLoadingApp] = useState(false);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [properties, setProperties] = useState([]);
  const [currentProperty, setCurrentProperty] = useState('');
  const [graph, setGraph] = useState(null);
  const [segmentationLabels, setSegmentationLabels] = useState([]);
  const [currentSegmentationLabel, setCurrentSegmentationLabel] = useState('');
  const [seriesUid, setSeriesUid] = useState('');
  const graphRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingApp(true);
      const series_uid = JSON.parse(localStorage.getItem('series_uid'));
      setSeriesUid(series_uid);
      await loadSegmentations(series_uid);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const updateGraph = async () => {
      if (currentSegmentationLabel && seriesUid) {
        setLoadingGraph(true);
        await load3DData(currentSegmentationLabel, seriesUid);
      }
    };
    updateGraph();
  }, [currentSegmentationLabel, seriesUid]);

  useEffect(() => {
    if (segmentationData && currentProperty) {
      try {
        const graph = _3DSegmentationApiClass.decompressSegmentation(
          segmentationData[currentProperty]
        );
        setGraph(graph);
        setSegmentationError(null);
        setLoadingGraph(false);
      } catch (error) {}
    }
  }, [segmentationData, currentProperty]);

  const loadSegmentations = async series_uid => {
    try {
      const segmentationLabels = await _3DSegmentationApiClass.get3DLabels(
        series_uid
      );
      setSegmentationLabels(segmentationLabels);
      setCurrentSegmentationLabel(segmentationLabels[0]);
      setLoadingApp(false);
      await load3DData(segmentationLabels[0], series_uid);
    } catch (error) {}
  };

  const load3DData = async (label, series_uid) => {
    try {
      const segmentationData = await _3DSegmentationApiClass.get3DSegmentationData(
        {
          series_uid,
          label,
        }
      );
      const segmentationProperties = Object.keys(segmentationData);
      setProperties(segmentationProperties);
      setCurrentProperty(segmentationProperties[0]); // view first property
      setSegmentationData(segmentationData);
    } catch (error) {
      setSegmentationError(error.message);
      setSegmentationData(null);
    } finally {
      setLoadingGraph(false);
    }
  };

  const changeProperty = property => {
    if (property) {
      setCurrentProperty(property);
    }
  };

  const changeSegmentationLabel = e => {
    const selectedSegmentationLabel = e.target.value;
    setCurrentSegmentationLabel(selectedSegmentationLabel);
  };

  const getImage = async () => {
    const customScene = graphRef.current.el.layout.scene;

    const plotDiv = graphRef.current.el;
    const { graphDiv } = plotDiv._fullLayout.scene._scene;
    console.log(graphRef.current);
    const divToDownload = {
      ...graphDiv,
      layout: { ...graphDiv.layout, scene: customScene },
    };

    const toImageOpts = {
      format: 'png',
      width: 1000,
      height: 600,
    };

    try {
      const imageData = await Plotly.toImage(divToDownload, toImageOpts);
      localStorage.setItem(
        'print-chart',
        JSON.stringify({
          image: response,
        })
      );
      setCurrentImage(imageData);
    } catch (error) {
      console.error(error);
    }
  };

  const debouncedGetImage = debounce(getImage, 500);

  const handleImageDownload = () => {
    debouncedGetImage();
  };

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
      {loadingApp ? (
        <p>Loading 3D Morphology...</p>
      ) : (
        <>
          <h1
            style={{
              textAlign: 'left',
              margin: 0,
            }}
          >
            3D Morphology
          </h1>

          <div>
            <label htmlFor="segmentationLabel">Segmentation Label: </label>
            <select
              style={{
                padding: '5px 12px',
                borderRadius: '13px',
                fontSize: '15px',
                backgroundColor: 'rgb(26, 28, 33)',
                color: '#fff',
              }}
              name="segmentationLabel"
              id="segmentationLabel"
              onChange={changeSegmentationLabel}
              value={currentSegmentationLabel}
            >
              {segmentationLabels.map(label => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {segmentationError ? (
            <p>Error: {segmentationError}</p>
          ) : loadingGraph ? (
            <p>Loading segmentation data...</p>
          ) : (
            <>
              <div>
                <label htmlFor="property">Property: </label>
                <select
                  style={{
                    padding: '5px 12px',
                    borderRadius: '13px',
                    fontSize: '15px',
                    backgroundColor: 'rgb(26, 28, 33)',
                    color: '#fff',
                  }}
                  name="property"
                  id="property"
                  onChange={e => changeProperty(e.target.value)}
                  value={currentProperty}
                >
                  {properties.map(property => (
                    <option key={property} value={property}>
                      {property}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Plot
                  //  style={{
                  //   width: '100%',
                  //   height:"200px"
                  // }}
                  data={graph ? [graph] : []}
                  layout={{
                    paper_bgcolor: '#000',
                    font: { color: '#ffffff', size: '14px' },
                    width: 1200,
                    height: 700,
                    scene: {
                      aspectmode: 'data',
                      xaxis: { title: 'X Axis' },
                      yaxis: { title: 'Y Axis' },
                      zaxis: { title: 'Z Axis' },
                    },
                  }}
                  ref={ref}
                />
              </div>
              {/* <div>
                <button onClick={handleImageDownload}>Download Image</button>
              </div> */}
              {currentImage && (
                <div>
                  <img src={currentImage} alt="3D Segmentation" />
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
});

// class Morphology3DComponent extends React.Component {
//   constructor(props) {
//     super();
//     this.state = {
//       currentImage: '',
//       segmentationData: null,
//       segmentationError: '',
//       loadingApp: false,
//       loadingGraph: false,
//       properties: [],
//       currentProperty: '',
//       graph: null,
//       segmentationLabels: [],
//       currentSegmentationLabel: '',
//       series_uid: '',
//     };
//     this.graphRef = React.createRef(null);
//     // Function binds
//     this.getImage = this.getImage.bind(this);
//     this.changeProperty = this.changeProperty.bind(this);
//     this.changeSegmentationLabel = this.changeSegmentationLabel.bind(this);
//     this.loadSegmentations = this.loadSegmentations.bind(this);
//     this.load3DData = this.load3DData.bind(this);
//   }

//   async componentDidMount() {
//     this.setState({ loadingApp: true });
//     const series_uid = JSON.parse(localStorage.getItem('series_uid'));
//     this.setState({ series_uid });
//     await this.loadSegmentations(series_uid);
//     this.setState({ loadingApp: false });
//   }

//   async componentDidUpdate(_, state) {
//     if (
//       state.currentSegmentationLabel !== this.state.currentSegmentationLabel
//     ) {
//       const { currentSegmentationLabel, series_uid } = this.state;
//       if (currentSegmentationLabel && series_uid) {
//         const { currentSegmentationLabel, series_uid } = this.state;
//         this.setState({ loadingGraph: true });
//         await this.load3DData(currentSegmentationLabel, series_uid);
//       }
//     }
//     if (state.currentProperty !== this.state.currentProperty) {
//       if (this.state.segmentationData && this.state.currentProperty) {
//         const graph = _3DSegmentationApiClass.decompressSegmentation(
//           this.state.segmentationData[this.state.currentProperty]
//         );
//         this.setState({ graph });
//         this.setState({ segmentationError: null });
//         this.setState({ loadingGraph: false });
//       }
//     }
//   }

//   loadSegmentations = async series_uid => {
//     try {
//       // Implement Caching
//       const segmentationLabels = await _3DSegmentationApiClass.get3DLabels(
//         series_uid
//       );
//       this.setState({ segmentationLabels });
//       const currentSegmentationLabel = segmentationLabels[1];
//       this.setState({ currentSegmentationLabel: segmentationLabels[1] });
//       // await this.load3DData(currentSegmentationLabel, series_uid);
//     } catch (error) {
//       // handle getting segmentation error
//     }
//   };

//   load3DData = async (label, series_uid) => {
//     try {
//       // Implement Caching
//       const segmentationData = await _3DSegmentationApiClass.get3DSegmentationData(
//         {
//           series_uid,
//           label,
//         }
//       );
//       const segmentationProperties = Object.keys(segmentationData);
//       this.setState({ properties: segmentationProperties });
//       this.setState({ currentProperty: segmentationProperties[0] }); // view first property
//       this.setState({ segmentationData });
//     } catch (error) {
//       this.setState({ segmentationError: error.message });
//       this.setState({ segmentationData: null });
//     } finally {
//       this.setState({ loadingGraph: false });
//     }
//   };

//   changeProperty(property) {
//     if (property) {
//       this.setState({ currentProperty: property });
//     }
//   }

//   changeSegmentationLabel(e) {
//     const selectedSegmentationLabel = e.target.value;
//     this.setState({ currentSegmentationLabel: selectedSegmentationLabel });
//   }

//   async getImage() {
//     const customScene = this.graphRef.current.el.layout.scene;

//     const plotDiv = this.graphRef.current.el;
//     const { graphDiv } = plotDiv._fullLayout.scene._scene;
//     console.log(this.graphRef.current);
//     const divToDownload = {
//       ...graphDiv,
//       layout: { ...graphDiv.layout, scene: customScene },
//     };
//     const response = await Plotly.toImage(divToDownload, {
//       format: 'png',
//       width: 800,
//       height: 600,
//     });

//     localStorage.setItem(
//       'print-chart',
//       JSON.stringify({
//         image: response,
//       })
//     );

//     this.setState({
//       currentImage: response,
//     });
//   }

//   onPlotlyUpdate = figure => {
//     debounce(this.getImage, {
//       delay: 5000,
//     });
//   };

//   render() {
//     const tabs = this.state.properties;
//     const { segmentationLabels } = this.state;
//     const TextContainer = ({ title }) => (
//       <span
//         style={{
//           fontSize: '15px',
//           color: '#fff',
//           textAlign: 'center',
//           margin: '20px 0',
//           display: 'block',
//         }}
//       >
//         {title}
//       </span>
//     );

//     return (
//       <section className="morphology-section">
//         <h1 className="morphology-heading">3D Morphology</h1>
//         {this.state.loadingApp ? (
//           <TextContainer title="Loading 3D Morphology Component. . ." />
//         ) : (
//           <>
//             <nav className="hide-on-print morphology-nav">
//               <div className="morphology-tab-container">
//                 {tabs.map(tab => (
//                   <div
//                     className={`morphology-tab ${
//                       this.state.currentProperty === tab ? 'active' : ''
//                     }`}
//                     onClick={this.changeProperty.bind(this, tab)}
//                     key={tab}
//                   >
//                     {tab}
//                   </div>
//                 ))}
//               </div>
//               <div className="morphology-select-container">
//                 <select
//                   className="morphology-select"
//                   id="segmentation_labels"
//                   name="SegmentationLabels"
//                   onChange={this.changeSegmentationLabel}
//                   value={this.state.currentSegmentationLabel}
//                 >
//                   <option disabled value="none">
//                     select a label
//                   </option>
//                   {segmentationLabels.map((label, idx) => (
//                     <option key={idx}>{label}</option>
//                   ))}
//                 </select>
//                 <label
//                   className="morphology-select-label"
//                   htmlFor="segmentation_labels"
//                 >
//                   Segmentation Label
//                 </label>
//               </div>
//             </nav>
//             <div className="hide-on-print morphology-plot-container">
//               {this.state.loadingGraph ? (
//                 <TextContainer title="Loading 3D. . ." />
//               ) : !this.state.loadingGraph && this.state.segmentationError ? (
//                 <TextContainer title={this.state.segmentationError} />
//               ) : (
//                 <Plot
//                   className="morphology-plot"
//                   data={[
//                     {
//                       ...this.state.graph,
//                     },
//                   ]}
//                   layout={{
//                     paper_bgcolor: '#000',
//                     font: { color: '#ffffff', size: '14px' },
//                   }}
//                   // onInitialized={this.getImage}
//                   // onUpdate={this.getImage}
//                   config={{ displaylogo: false, responsive: true }}
//                   ref={this.graphRef}
//                 />
//               )}
//             </div>
//           </>
//         )}
//       </section>
//     );
//   }
// }

export { Morphology3DComponent };
