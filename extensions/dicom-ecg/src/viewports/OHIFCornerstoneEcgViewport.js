import React, { useCallback, useContext, useEffect, useState } from 'react';

import WaveformView from './WaveformView';

const convertBuffer = (dataSrc, numberOfChannels, numberOfSamples, bits, type) => {
  const ret = [];
  const data = new Uint8Array(dataSrc);
  const length = data.byteLength || data.length;
  console.log('data size', length, numberOfChannels, numberOfSamples);
  const expectedLength = (bits == 8 ? 1 : 2) * numberOfChannels * numberOfSamples;
  if (length != expectedLength) {
    console.warn("Data length is too short", data, length, expectedLength);
  }
  if (bits == 16) {
    if (type == "SS") {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const buffer = new Int16Array(numberOfSamples);
        ret.push(buffer);
        let sampleI = 0;
        for (let sample = 2 * channel; sample < length; sample += (2 * numberOfChannels)) {
          const sample0 = data[sample + 1];
          const sample1 = data[sample];
          const sign = sample0 & 0x80;
          buffer[sampleI++] = sign && (0xFFFF0000 | (sample0 << 8) | sample1) || ((sample0 << 8) | sample1);
          // buffer[sampleI++] = sample1 << 8 | sample0;
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

const str2ab = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));

const getChannelData = async (data, numberOfChannels, numberOfSamples, bits, type) => {
  if (data.Value) return data.Value;
  if (data.InlineBinary) {
    data.Value = convertBuffer(str2ab(data.InlineBinary), numberOfChannels, numberOfSamples, bits, type);
    return data.Value;
  }
  if (data.retrieveBulkData) {
    const bulkdata = await data.retrieveBulkData();
    console.log('bulkdata=', bulkdata);
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

  const secondsWidth = 150;
  const itemHeight = 250;
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
    <div className="bg-primary-black w-full h-full overflow-hidden ohif-scrollbar">
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
