import React from "react";
import EcgTrace from "./EcgTrace";
import GridPattern from "./GridPattern";

const WaveformView = (props) => {
  const { channelDefinition = {}, itemHeight } = props;

  const { ChannelSourceSequence = {} } = channelDefinition;

  console.log('channel definition', channelDefinition);
  return (
    <>
      <text stroke="none" fill="white" x="5" y={20 - itemHeight / 2}>{ChannelSourceSequence.CodeMeaning}</text>
      {GridPattern(props)}
      {EcgTrace(props)}
    </>
  )
}

export default WaveformView;
