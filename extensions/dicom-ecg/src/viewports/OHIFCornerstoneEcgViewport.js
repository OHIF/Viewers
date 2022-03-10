import React, { useCallback, useContext, useEffect, useState } from 'react';

import WaveformView from './WaveformView';

const convertBuffer = (data, numberOfChannels, numberOfSamples, bits, type) => {
  const ret = [];
  console.log('data size', data.length, numberOfChannels, numberOfSamples);
  if (data.length != (bits == 8 ? 1 : 2) * numberOfChannels * numberOfSamples) {
    console.warn("Data length is too short");
  }
  if (bits == 16) {
    if (type == "SS") {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const buffer = new Int16Array(numberOfSamples);
        ret.push(buffer);
        let sampleI = 0;
        for (let sample = 2 * channel; sample < data.length; sample += (2 * numberOfChannels)) {
          const sign = data[sample] & 0x80;
          buffer[sampleI++] = sign && (0xFFFF0000 | (data[sample] << 8) | data[sample + 1]) || ((data[sample] << 8) | data[sample + 1]);
        }
      }
    } else {
      throw new Error(`Unsupported type ${type}`)
    }
  } else {
    throw new Error(`Unsupported bits ${bits}`);
  }
  return ret;
}

const getChannelData = async (data, numberOfChannels, numberOfSamples, bits, type) => {
  if (data.Value) return data.Value;
  if (data.InlineBinary) {
    data.Value = convertInlineBinary(data.InlineBinary, bits, type);
    return data.Value;
  }
  if (data.retrieveBulkData) {
    const bulkdata = await data.retrieveBulkData();
    data.Value = convertBuffer(bulkdata, numberOfChannels, numberOfSamples, bits, type);
    return data.Value;
  }
  console.log("Can't convert waveform", data);
  return [];
}

function OHIFCornerstoneEcgViewport(props) {
  const { displaySet, } = props;
  const { others } = displaySet;
  const [channelData, setChannelData] = useState([]);

  if (!others.length) {
    return (<span className="text-red-700">No ECG in display set</span>)
  }

  const waveform = others[0].WaveformSequence[0];

  if (!waveform) {
    return (
      <span className="text-red-700">Waveform data not found</span>
    )
  }

  const {
    MultiplexGroupLabel, WaveformSampleInterpretation,
    NumberOfWaveformChannels, NumberOfWaveformSamples,
    SamplingFrequency, WaveformData, WaveformBitsAllocated,
    ChannelDefinitionSequence = [],
  } = waveform;

  const secondsWidth = 200;
  const itemHeight = 400;
  const pxWidth = Math.ceil(NumberOfWaveformSamples * secondsWidth / SamplingFrequency);
  const pxHeight = NumberOfWaveformChannels * itemHeight;
  const extraHeight = 4;

  useEffect(() => {
    getChannelData(WaveformData, NumberOfWaveformChannels, NumberOfWaveformSamples, WaveformBitsAllocated, WaveformSampleInterpretation).then(res => {
      setChannelData(res);
    })
  }, [WaveformData])

  console.log('ECG on', waveform);

  const groups = [];
  for (let i = 0; i < NumberOfWaveformChannels; i++) {
    groups.push(
      <g key={i} transform={`translate(0,${i * (itemHeight + extraHeight) - itemHeight / 2})`}>
        {WaveformView({
          secondsWidth, itemHeight, pxWidth,
          data: channelData[i],
          channelDefinition: ChannelDefinitionSequence[i],
        })}
      </g>
    );
  }

  // Need to copies of the source to fix a firefox bug
  return (
    <div className="bg-primary-black w-full h-full">
      <span className="text-white">ECG {MultiplexGroupLabel}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={pxWidth}
        height={pxHeight}
        viewBox={`0 0 ${pxWidth} ${pxHeight}`}
      >
        <title>ECG</title>
        {groups}
      </svg>
    </div>
  )
}

export default OHIFCornerstoneEcgViewport;
