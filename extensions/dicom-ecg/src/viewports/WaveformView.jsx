import React from "react";
import EcgTrace from "./EcgTrace";
import GridPattern from "./GridPattern";

const WaveformView = (props) => {
  const { channelDefinition = {}, itemHeight } = props;

  const { ChannelSourceSequence = {} } = channelDefinition;
  const scaleRange = 4000;
  const scale = itemHeight / scaleRange;
  // Values about -2500 ... 2500 fitting into itemHeight (-150..150 currently)
  const subProps = { ...props, scale };

  console.log('channel', ChannelSourceSequence.CodeMeaning);
  console.log('channel baseline', channelDefinition.ChannelBaseline);
  return (
    <>
      {GridPattern(subProps)}
      {EcgTrace(subProps)}
      <text stroke="none" fill="white" x="5" y={20 - itemHeight / 2}>{ChannelSourceSequence.CodeMeaning}</text>
    </>
  )
}

export default WaveformView;
