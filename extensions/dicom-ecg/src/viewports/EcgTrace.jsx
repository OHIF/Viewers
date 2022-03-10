import React from "react";

const EcgTrace = (props) => {
  const { data, secondsWidth, itemHeight, pxWidth } = props;
  if (!data) {
    return null;
  }

  const trace = [`M0 0`];
  for (let i = 0; i < data.length; i++) {
    const x = i * pxWidth / data.length;
    const y = data[i] * itemHeight / 65536;
    trace.push(`L${x} ${y}`)
  }
  return <path d={trace.join()} stroke="white" fill="none" />;
}

export default EcgTrace;
