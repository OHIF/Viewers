import React from "react";

const GridPattern = (props) => {
  const { secondsWidth, itemHeight, pxWidth } = props;

  const path = [];

  const height = itemHeight / 2;
  const lineHeight = 25;
  const hLines = Math.floor(height / lineHeight);
  const vLines = 1 + Math.floor((1 + pxWidth) / secondsWidth);

  for (let h = 1; h < hLines; h++) {
    path.push(`M 0 ${h * lineHeight} l ${pxWidth} 0`)
    path.push(`M 0 ${-h * lineHeight} l ${pxWidth} 0`)
  }

  for (let v = 0; v < vLines; v++) {
    path.push(`M ${v * secondsWidth} ${-height} l 0 ${itemHeight}`)
  }

  return (
    <>
      <path d={`M 0 0 l ${pxWidth} 0`} strokeWidth="4" stroke="orange" />
      <path d={path.join()} stroke="red" strokeWidth="1" fill="none" />
    </>
  );
}

export default GridPattern;
