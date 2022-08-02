/**
 * ReadECGData.
 */
class ReadECGData {
  /**
   * Read and return ECG Data.
   * Structure: Waveform - Multiplex - channel - sample
   * @param {DataSet ECG} dataSet
   */
  readData(dataSet) {
    let mg = {}; // multiplexGroup
    let channelSourceSequence = dataSet.elements.x003a0208;
    if (channelSourceSequence !== undefined) {
      //console.log('Channel Source Sequence is present');
      if (channelSourceSequence.items.length > 0) {
        //console.log(channelSourceSequence);
      }
    }

    let waveformSequence = dataSet.elements.x54000100;
    if (waveformSequence !== undefined) {
      //console.log('Waveform data is present');
      if (waveformSequence.items.length > 0) {
        waveformSequence.items.forEach(function(item) {
          //console.log('Item tag: ' + item.tag);
          if (item.tag == 'xfffee000') {
            // item start tag
            // console.log(item);
            let multiplexGroup = item.dataSet;
            // console.log(multiplexGroup);
            mg.waveformOriginality = multiplexGroup.string('x003a0004'); // VR = CS
            mg.numberOfWaveformChannels = multiplexGroup.uint16('x003a0005'); // VR = US
            mg.numberOfWaveformSamples = multiplexGroup.uint32('x003a0010'); // VR = UL
            mg.samplingFrequency = multiplexGroup.floatString('x003a001a'); // VR = DS
            mg.multiplexGroupLabel = multiplexGroup.string('x003a0020'); // VR = SH
            // Initialization of channels
            mg.channels = [];
            let channelDefinitionSequence = multiplexGroup.elements.x003a0200;
            // console.log(channelDefinitionSequence);
            let numDefinition = 0;
            if (channelDefinitionSequence !== undefined) {
              if (channelDefinitionSequence.items.length > 0) {
                channelDefinitionSequence.items.forEach(function(item) {
                  if (item.tag == 'xfffee000') {
                    // item start tag
                    // console.log("numDefinition: " + numDefinition);
                    let channelDefinition = item.dataSet;
                    let cd = {}; // channelDefinition
                    // console.log(channelDefinition);

                    cd.channelSource = ReadECGData.readCodeSequence(
                      channelDefinition.elements.x003a0208
                    );

                    // http://stackoverflow.com/questions/12855400/rchannel-sensitivity-in-dicom-waveforms
                    cd.channelSensitivity = channelDefinition.string(
                      'x003a0210'
                    ); // VR = DS
                    cd.channelSensitivityUnits = ReadECGData.readCodeSequence(
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
            //console.log(mg);

            mg.waveformBitsAllocated = multiplexGroup.uint16('x54001004'); // VR = US
            mg.waveformSampleInterpretation = multiplexGroup.string(
              'x54001006'
            ); // VR = CS

            let waveformPaddingValue;
            let waveformData;
            switch (mg.waveformBitsAllocated) {
              case 8:
                switch (mg.waveformSampleInterpretation) {
                  case 'SB': // signed 8 bit linear
                  case 'UB': // unsigned 8 bit linear
                  case 'MB': // 8 bit mu-law (in accordance with ITU-T Recommendation G.711)
                  case 'AB': // 8 bit A-law (in accordance with ITU-T Recommendation G.711)
                  default:
                    waveformPaddingValue = multiplexGroup.string('x5400100a'); // VR = OB
                    waveformData = multiplexGroup.string('x54001010'); // VR = OB or OW (OB)
                }
                break;

              case 16:
                switch (mg.waveformSampleInterpretation) {
                  case 'SS': // signed 16 bit linear
                    waveformPaddingValue = multiplexGroup.int16('x5400100a'); // VR = OB or OW (OW->SS)
                    waveformData = multiplexGroup.string('x54001010'); // VR = OB or OW
                    var sampleOffset =
                      multiplexGroup.elements.x54001010.dataOffset;
                    //var sampleSize = multiplexGroup.elements.x54001010.length / 2; // 16 bit!
                    var sampleSize =
                      mg.numberOfWaveformSamples * mg.numberOfWaveformChannels;
                    /*console.log(
                      'sampleOffset: ' +
                        sampleOffset +
                        ', sampleSize: ' +
                        sampleSize
                    );*/
                    var sampleData = new Int16Array(
                      dataSet.byteArray.buffer,
                      sampleOffset,
                      sampleSize
                    );

                    var pos = 0;

                    // 10 mm/mV is a rather standard value for ECG

                    for (
                      let numSample = 0;
                      numSample < mg.numberOfWaveformSamples;
                      numSample++
                    ) {
                      for (
                        let numChannel = 0;
                        numChannel < mg.numberOfWaveformChannels;
                        numChannel++
                      ) {
                        // mg.channels[numChannel].samples.push(sampleData[pos] * mg.channels[numChannel].channelDefinition.channelSensitivity);
                        mg.channels[numChannel].samples.push(sampleData[pos]);
                        pos++;
                        // sample = dataSet.byteArray, offset, ...
                      }
                    }
                    //console.log('Multiplex samples have been read');

                    break;
                  case 'US': // unsigned 16 bit linear
                    waveformPaddingValue = multiplexGroup.uint16('x5400100a'); // VR = OB or OW (OW->US)
                    waveformData = multiplexGroup.string('x54001010'); // VR = OB or OW
                    break;
                  default:
                  //console.log(mg.waveformSampleInterpretation);
                  // throw
                }
                break;

              default:
              // throw
            }

            /*
            console.log('waveformBitsAllocated: ' + mg.waveformBitsAllocated);
            console.log(
              'waveformSampleInterpretation: ' + mg.waveformSampleInterpretation
            );
            console.log('waveformPaddingValue: ' + waveformPaddingValue); // ToDo...
            */

            /**
             * Channel Sensitivity: Nominal numeric value of unit quantity of sample. Required if samples represent defined (not arbitrary) units.
             * Channel Sensitivity Units Sequence: A coded descriptor of the Units of measure for the Channel Sensitivity.
             * Channel Sensitivity Correction Factor: Multiplier to be applied to encoded sample values to match units specified in Channel Sensitivity
             * Channel Baseline: Offset of encoded sample value 0 from actual 0 using the units defined in the Channel Sensitivity Units Sequence
             */
            let adjValue;
            for (
              let numChannel = 0;
              numChannel < mg.numberOfWaveformChannels;
              numChannel++
            ) {
              let channel = mg.channels[numChannel];
              let baseline = Number(channel.channelDefinition.channelBaseline);
              let sensitivity = Number(
                channel.channelDefinition.channelSensitivity
              );
              let sensitivityCorrectionFactor = Number(
                channel.channelDefinition.channelSensitivityCorrectionFactor
              );

              // ATM: Units hardcoded as uV. ToDo: Change this!
              // var units = channel.channelDefinition.channelSensitivityUnits.codeValue;

              for (
                let numSample = 0;
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
          }
        });
      }
    }
    return mg;
  }

  /**
   * Helper function to read sequences of coded elements, like:
   * - Channel Source Sequence (003A,0208)
   * - Channel Sensitivity Units Sequence (003A,0211)
   */
  static readCodeSequence(codeSequence) {
    let code = {};
    if (codeSequence !== undefined) {
      if (codeSequence.items.length > 0) {
        let codeDataset = codeSequence.items[0].dataSet;
        //console.log(codeDataset);
        code.codeValue = codeDataset.string('x00080100'); // VR = SH
        code.codingSchemeDesignator = codeDataset.string('x00080102'); // VR = SH
        code.codingSchemeVersion = codeDataset.string('x00080103'); // VR = SH
        code.codeMeaning = codeDataset.string('x00080104'); // VR = LO
      }
    }
    return code;
  }
}
export default ReadECGData;
