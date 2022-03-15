import React from "react";

const EcgTrace = (props) => {
  const { data, itemHeight, pxWidth, scale, baseline = 0 } = props;
  if (!data) {
    return null;
  }

  const trace = [`M0 0`];
  let minV = 1000;
  let maxV = -1000;
  for (let i = 0; i < data.length; i++) {
    const x = i * pxWidth / data.length;
    const y = baseline - data[i];
    minV = Math.min(minV, data[i]);
    maxV = Math.max(maxV, data[i]);
    trace.push(`L${x} ${scale * y}`)
  }
  console.log('minV,maxV=', minV, maxV);
  return <path d={trace.join()} stroke="white" fill="none" />;
}

export default EcgTrace;
