import React, { Component, createRef } from 'react';
import dicomParser from 'dicom-parser';
import PropTypes from 'prop-types';
import TypedArrayProp from './TypedArrayProp';
import './DicomECGViewport.css';
import ReadECGData from './utils/ReadECGData';
import DrawGraphs from './utils/DrawGraphs';

// TODO: Should probably use dcmjs for this
const SOP_CLASS_UIDS = {
  Sop12LeadECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.1', //YES
  GeneralECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.2', //YES
  AmbulatoryECGWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.1.3', //NO
  HemodynamicWaveformStorage: '1.2.840.10008.5.1.4.1.1.9.2.1', //YES
};

class DicomECGViewport extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fileURL: null,
      error: null,
      currentPageIndex: 1,
      scale: 1,
    };

    this.canvas = createRef();
    this.textLayer = createRef();
    this.readECGData = new ReadECGData();
  }

  static propTypes = {
    byteArray: TypedArrayProp.uint8,
    useNative: PropTypes.bool,
    viewportData: PropTypes.object,
    activeViewportIndex: PropTypes.number,
    setViewportActive: PropTypes.func,
    viewportIndex: PropTypes.number,
  };

  static defaultProps = {
    useNative: false,
  };

  //Load Component:
  async componentDidMount() {
    //Element enable:
    const {
      //viewportData,
      setViewportActive,
      viewportIndex,
      activeViewportIndex,
    } = this.props;

    //Enable viewport:
    if (viewportIndex !== activeViewportIndex) {
      setViewportActive(viewportIndex);
    }

    this.setState(state => ({ ...state }));
    if (!this.props.useNative) {
      this.setState(state => ({ ...state }), () => this.loadInstance());
    }
  }

  //On update element:
  componentDidUpdate(prevProps) {
    const { displaySet } = this.props.viewportData;
    const prevDisplaySet = prevProps.viewportData.displaySet;
    if (
      displaySet.displaySetInstanceUID !==
        prevDisplaySet.displaySetInstanceUID ||
      displaySet.SOPInstanceUID !== prevDisplaySet.SOPInstanceUID
    ) {
      this.setState(state => ({ ...state }), () => this.loadInstance());
    }
  }

  //Render view:
  render() {
    let id = 'myWaveform' + this.props.viewportIndex;
    return (
      <React.Fragment>
        <div className="waveform">
          <div className="wavedata"></div>
          <div id={id} />
        </div>
        <div className="wavemenu" />
      </React.Fragment>
    );
  }

  /**
   * Load data:
   */
  loadInstance() {
    //Load dataSet:
    let dataSet = dicomParser.parseDicom(this.props.byteArray);
    let sopClassUID = dataSet.string('x00080016');
    //Read data from dataSet:
    let dataMg = this.readECGData.readData(dataSet);
    //Crate instance drawGrahps:
    let drawGraphs;
    //make the image based on whether it is color or not
    switch (sopClassUID) {
      case SOP_CLASS_UIDS.HemodynamicWaveformStorage: //Hemodynamic Waveform Storage
        drawGraphs = new DrawGraphs(dataMg, this.props.viewportIndex);
        drawGraphs.draw();
        break;
      case SOP_CLASS_UIDS.AmbulatoryECGWaveformStorage: //Ambulatory
        drawGraphs.noCompatible();
        break;
      case SOP_CLASS_UIDS.GeneralECGWaveformStorage: //General ECG Waveform Storage
        drawGraphs = new DrawGraphs(dataMg, this.props.viewportIndex);
        drawGraphs.draw();
        break;
      case SOP_CLASS_UIDS.Sop12LeadECGWaveformStorage: //12-lead ECG Waveform Storage
        drawGraphs = new DrawGraphs(dataMg, this.props.viewportIndex);
        drawGraphs.draw();
        break;
      default:
        drawGraphs.noCompatible();
        console.log('Unsupported SOP Class UID: ' + sopClassUID);
    }
  }
}

export default DicomECGViewport;
