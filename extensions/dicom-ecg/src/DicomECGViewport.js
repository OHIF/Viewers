import React, { Component, createRef } from 'react';
import dicomParser from 'dicom-parser';
import PropTypes from 'prop-types';
import c3 from 'c3';
import TypedArrayProp from './TypedArrayProp';
import './DicomECGViewport.css';

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
      <div className="waveform">
        <div id={id} />
      </div>
    );
  }

  //Methods:
  //-----------------------------------------------------------------------
  loadInstance() {
    var dataSet = dicomParser.parseDicom(this.props.byteArray);
    DicomECGViewport.createInstanceObject(dataSet, this.props.viewportIndex);
  }

  //Loac ECG:
  static async addDOMChart(chartId, index) {
    let id = 'myWaveform' + index;
    document.getElementById(id).innerHTML += '<div id="' + chartId + '"></div>';
  }

  static async createInstanceObject(dataSet, index) {
    //Loader:
    let id = 'myWaveform' + index;
    document.getElementById(id).innerHTML = '<div class="loader"></div>'; //Clear
    await new Promise(resolve => setTimeout(resolve, 1000));

    //make the image based on whether it is color or not
    var sopClassUID = dataSet.string('x00080016');
    switch (sopClassUID) {
      case SOP_CLASS_UIDS.HemodynamicWaveformStorage: //Hemodynamic Waveform Storage
        DicomECGViewport.GenerateECGWaveform(dataSet, sopClassUID, index);
        break;
      case SOP_CLASS_UIDS.AmbulatoryECGWaveformStorage: //Ambulatory
        DicomECGViewport.nocompatible(index);
        break;
      case SOP_CLASS_UIDS.GeneralECGWaveformStorage: //General ECG Waveform Storage
        DicomECGViewport.GenerateECGWaveform(dataSet, sopClassUID, index);
        break;
      case SOP_CLASS_UIDS.Sop12LeadECGWaveformStorage: //12-lead ECG Waveform Storage
        DicomECGViewport.GenerateECGWaveform(dataSet, sopClassUID, index);
        break;
      default:
        console.log('Unsupported SOP Class UID: ' + sopClassUID);
    }
  }

  //No compatible ECG
  static nocompatible(index) {
    let id = 'myWaveform' + index;
    DicomECGViewport.removeLoader();
    document.getElementById(id).innerHTML =
      '<h1 style="vertical-align: center;text-align: center;">ECG NO COMPATIBLE</h1>';
  }

  //Remove loader:
  static removeLoader() {
    let load = Array.from(document.getElementsByClassName('loader'));
    load.forEach(element => {
      element.remove();
    });
  }

  static bindChart(chartId, channelData, yAxis) {
    //console.log(yAxis);
    var samples = channelData.samples;
    var codeMeaning = channelData.channelDefinition.channelSource.codeMeaning;
    //var yMax = 1500;
    //var yMin = -500;
    //var yMax = 2.0;
    //var yMin = -0.4;
    //var deltaYSecondary = 100;
    //var deltaYMain = 500;
    var xMin = 0;
    var xMax = samples.length;
    var deltaX = 40;
    var deltaX2 = 200;

    var params = {
      bindto: '#' + chartId,
      data: {
        columns: [[codeMeaning]],
      },
      /*zoom: {
        enabled: true,
      },
      subchart: {
        show: true,
      },*/
      point: {
        show: false,
      },
      transition: {
        duration: 0,
      },
      axis: {
        x: {
          tick: {
            count: 1,
          },
        },
        y: {
          max: yAxis.max,
          min: yAxis.min,
          label: {
            text: yAxis.label,
            position: 'outer-middle',
          },
          tick: {
            values: [],
          },
        },
      },
      grid: {
        //40(200) ms, 40(200) uV ?
        x: {
          lines: [],
        },
        y: {
          lines: [],
        },
      },
    };

    params.data.columns[0] = params.data.columns[0].concat(samples);

    for (var y = yAxis.min; y <= yAxis.max; y += yAxis.deltaSecondary) {
      params.grid.y.lines.push({ value: y });
    }

    for (var y = yAxis.min; y <= yAxis.max; y += yAxis.deltaMain) {
      params.grid.y.lines.push({ value: y });
      params.axis.y.tick.values.push(y);
    }

    for (var x = xMin; x <= xMax; x += deltaX) {
      params.grid.x.lines.push({ value: x });
    }

    for (var x = xMin; x <= xMax; x += deltaX2) {
      params.grid.x.lines.push({ value: x });
    }

    //console.log(params);
    var chart = c3.generate(params);
    console.log('bindChart end');
  }

  /**
   * Helper function to read sequences of coded elements, like:
   * - Channel Source Sequence (003A,0208)
   * - Channel Sensitivity Units Sequence (003A,0211)
   */
  static readCodeSequence(codeSequence) {
    var code = {};
    if (codeSequence !== undefined) {
      if (codeSequence.items.length > 0) {
        var codeDataset = codeSequence.items[0].dataSet;
        //console.log(codeDataset);
        code.codeValue = codeDataset.string('x00080100'); // VR = SH
        code.codingSchemeDesignator = codeDataset.string('x00080102'); // VR = SH
        code.codingSchemeVersion = codeDataset.string('x00080103'); // VR = SH
        code.codeMeaning = codeDataset.string('x00080104'); // VR = LO
      }
    }
    return code;
  }

  //Load Sop12Lead, General ECGWaveform and Hemodinamic:
  static GenerateECGWaveform(dataSet, sopClassUID, index) {
    console.log('SOP Class UID: ' + sopClassUID);
    //Structure: Waveform - Multiplex - channel - sample
    var waveform = {};
    var channelSourceSequence = dataSet.elements.x003a0208;
    if (channelSourceSequence !== undefined) {
      console.log('Channel Source Sequence is present');
      if (channelSourceSequence.items.length > 0) {
        console.log(channelSourceSequence);
      }
    }

    var waveformSequence = dataSet.elements.x54000100;
    if (waveformSequence !== undefined) {
      console.log('Waveform data is present');
      if (waveformSequence.items.length > 0) {
        //var multiplex;
        waveform.multiplexGroup = {};
        waveformSequence.items.forEach(function(item) {
          console.log('Item tag: ' + item.tag);
          if (item.tag == 'xfffee000') {
            // item start tag
            // console.log(item);
            var multiplexGroup = item.dataSet;
            var mg = {}; // multiplexGroup
            // console.log(multiplexGroup);

            mg.waveformOriginality = multiplexGroup.string('x003a0004'); // VR = CS
            mg.numberOfWaveformChannels = multiplexGroup.uint16('x003a0005'); // VR = US
            mg.numberOfWaveformSamples = multiplexGroup.uint32('x003a0010'); // VR = UL
            mg.samplingFrequency = multiplexGroup.floatString('x003a001a'); // VR = DS
            mg.multiplexGroupLabel = multiplexGroup.string('x003a0020'); // VR = SH

            // Initialization of channels
            mg.channels = [];
            for (
              var numChannel = 0;
              numChannel < mg.numberOfWaveformChannels;
              numChannel++
            ) {
              // console.log(numChannel);
              var chartId = 'myChart_' + index + numChannel;
              if (
                document.getElementById(chartId) == null ||
                document.getElementById(chartId) == undefined
              ) {
                DicomECGViewport.addDOMChart(chartId, index);
              }
            }

            var channelDefinitionSequence = multiplexGroup.elements.x003a0200;
            // console.log(channelDefinitionSequence);
            var numDefinition = 0;
            if (channelDefinitionSequence !== undefined) {
              if (channelDefinitionSequence.items.length > 0) {
                channelDefinitionSequence.items.forEach(function(item) {
                  if (item.tag == 'xfffee000') {
                    // item start tag
                    // console.log("numDefinition: " + numDefinition);
                    var channelDefinition = item.dataSet;
                    var cd = {}; // channelDefinition
                    // console.log(channelDefinition);

                    cd.channelSource = DicomECGViewport.readCodeSequence(
                      channelDefinition.elements.x003a0208
                    );

                    // http://stackoverflow.com/questions/12855400/rchannel-sensitivity-in-dicom-waveforms
                    cd.channelSensitivity = channelDefinition.string(
                      'x003a0210'
                    ); // VR = DS
                    cd.channelSensitivityUnits = DicomECGViewport.readCodeSequence(
                      channelDefinition.elements.x003a0211
                    );
                    cd.channelSensitivityCorrectionFactor = channelDefinition.string(
                      'x003a0212'
                    ); // VR = DS
                    cd.channelBaseline = channelDefinition.string('x003a0213'); // VR = DS
                    // cd.channelTimeSkew = channelDefinition.string('x003a0214'); // VR = DS
                    // cd.channelSampleSkew = channelDefinition.string('x003a0215'); // VR = DS
                    cd.waveformBitsStored = channelDefinition.uint16(
                      'x003a021a'
                    ); // VR = US
                    // cd.filterLowFrequency = channelDefinition.string('x003a0220'); // VR = DS
                    // cd.filterHighFrequency = channelDefinition.string('x003a0221'); // VR = DS

                    mg.channels[numDefinition] = {};
                    mg.channels[numDefinition].channelDefinition = cd;
                    mg.channels[numDefinition].samples = [];

                    numDefinition++;
                  }
                });
              }
            }
            console.log(mg);

            mg.waveformBitsAllocated = multiplexGroup.uint16('x54001004'); // VR = US
            mg.waveformSampleInterpretation = multiplexGroup.string(
              'x54001006'
            ); // VR = CS
            switch (mg.waveformBitsAllocated) {
              case 8:
                switch (mg.waveformSampleInterpretation) {
                  case 'SB': // signed 8 bit linear
                  case 'UB': // unsigned 8 bit linear
                  case 'MB': // 8 bit mu-law (in accordance with ITU-T Recommendation G.711)
                  case 'AB': // 8 bit A-law (in accordance with ITU-T Recommendation G.711)
                  default:
                    var waveformPaddingValue = multiplexGroup.string(
                      'x5400100a'
                    ); // VR = OB
                    var waveformData = multiplexGroup.string('x54001010'); // VR = OB or OW (OB)
                }
                break;

              case 16:
                switch (mg.waveformSampleInterpretation) {
                  case 'SS': // signed 16 bit linear
                    var waveformPaddingValue = multiplexGroup.int16(
                      'x5400100a'
                    ); // VR = OB or OW (OW->SS)
                    var waveformData = multiplexGroup.string('x54001010'); // VR = OB or OW
                    var sampleOffset =
                      multiplexGroup.elements.x54001010.dataOffset;
                    //                                                var sampleSize = multiplexGroup.elements.x54001010.length / 2; // 16 bit!
                    var sampleSize =
                      mg.numberOfWaveformSamples * mg.numberOfWaveformChannels;
                    console.log(
                      'sampleOffset: ' +
                        sampleOffset +
                        ', sampleSize: ' +
                        sampleSize
                    );
                    var sampleData = new Int16Array(
                      dataSet.byteArray.buffer,
                      sampleOffset,
                      sampleSize
                    );

                    var pos = 0;

                    // 10 mm/mV is a rather standard value for ECG

                    for (
                      var numSample = 0;
                      numSample < mg.numberOfWaveformSamples;
                      numSample++
                    ) {
                      for (
                        var numChannel = 0;
                        numChannel < mg.numberOfWaveformChannels;
                        numChannel++
                      ) {
                        // mg.channels[numChannel].samples.push(sampleData[pos] * mg.channels[numChannel].channelDefinition.channelSensitivity);
                        mg.channels[numChannel].samples.push(sampleData[pos]);
                        pos++;
                        // sample = dataSet.byteArray, offset, ...
                      }
                    }
                    console.log('Multiplex samples have been read');

                    break;

                  case 'US': // unsigned 16 bit linear
                    var waveformPaddingValue = multiplexGroup.uint16(
                      'x5400100a'
                    ); // VR = OB or OW (OW->US)
                    var waveformData = multiplexGroup.string('x54001010'); // VR = OB or OW
                    break;

                  default:
                    console.log(waveformSampleInterpretation);
                  // throw
                }

                break;

              default:
              //                                     throw
            }

            console.log('waveformBitsAllocated: ' + mg.waveformBitsAllocated);
            console.log(
              'waveformSampleInterpretation: ' + mg.waveformSampleInterpretation
            );
            console.log('waveformPaddingValue: ' + waveformPaddingValue); // ToDo...

            /*
    Channel Sensitivity: Nominal numeric value of unit quantity of sample. Required if samples represent defined (not arbitrary) units.
    Channel Sensitivity Units Sequence: A coded descriptor of the Units of measure for the Channel Sensitivity.
    Channel Sensitivity Correction Factor: Multiplier to be applied to encoded sample values to match units specified in Channel Sensitivity
    Channel Baseline: Offset of encoded sample value 0 from actual 0 using the units defined in the Channel Sensitivity Units Sequence
    */
            var adjValue;
            for (
              var numChannel = 0;
              numChannel < mg.numberOfWaveformChannels;
              numChannel++
            ) {
              var channel = mg.channels[numChannel];
              var baseline = Number(channel.channelDefinition.channelBaseline);
              var sensitivity = Number(
                channel.channelDefinition.channelSensitivity
              );
              var sensitivityCorrectionFactor = Number(
                channel.channelDefinition.channelSensitivityCorrectionFactor
              );

              // ATM: Units hardcoded as uV. ToDo: Change this!
              // var units = channel.channelDefinition.channelSensitivityUnits.codeValue;

              for (
                var numSample = 0;
                numSample < mg.numberOfWaveformSamples;
                numSample++
              ) {
                adjValue =
                  baseline +
                  channel.samples[numSample] *
                    sensitivity *
                    sensitivityCorrectionFactor;
                channel.samples[numSample] = adjValue;
              }
            }

            // *** ToDo:
            // Automatic selection of units range depending on max / min values ??''
            // Automatic selection depending on SOP Class UID ?
            for (
              var numChannel = 0;
              numChannel < mg.numberOfWaveformChannels;
              numChannel++
            ) {
              var chartId = 'myChart_' + index + numChannel;
              var yAxis = {};

              switch (
                mg.channels[numChannel].channelDefinition
                  .channelSensitivityUnits.codeValue
              ) {
                case 'uV':
                  yAxis.min = -500;
                  yAxis.max = 1500;
                  yAxis.deltaMain = 500;
                  yAxis.deltaSecondary = 100;
                  break;

                case 'mV':
                  // *** ToDo: proper rounding of values in y axis
                  yAxis.min = -0.5;
                  yAxis.max = 1.5;
                  yAxis.deltaMain = 0.5;
                  yAxis.deltaSecondary = 0.1;
                  break;

                case 'mm[Hg]': // Better 60 ~ 160 range ?
                  yAxis.min = 0;
                  yAxis.max = 200;
                  yAxis.deltaMain = 100;
                  yAxis.deltaSecondary = 20;
                  break;

                default:
                  yAxis.min = -500;
                  yAxis.max = 1500;
                  yAxis.deltaMain = 500;
                  yAxis.deltaSecondary = 100;
              }

              yAxis.label =
                mg.channels[numChannel].channelDefinition
                  .channelSensitivityUnits.codeMeaning +
                ' (' +
                mg.channels[numChannel].channelDefinition
                  .channelSensitivityUnits.codeValue +
                ')';
              DicomECGViewport.bindChart(
                chartId,
                mg.channels[numChannel],
                yAxis
              );
            }
          }
        });
      }
    }

    //Cleal loader:
    DicomECGViewport.removeLoader();
  }
  //-----------------------------------------------------------------------
}

export default DicomECGViewport;
