import React from 'react';

// Use simple HTML entities instead of SVG components
export default function getExpandIcon() {
  console.log('getExpandIcon: Using simple HTML character triangles');
  
  const style = {
    color: '#5acce6',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block',
    width: '16px',
    height: '16px',
    textAlign: 'center',
    lineHeight: '16px'
  } as React.CSSProperties;
  
  if (this.state.expanded) {
    // Down-pointing triangle character
    return <span style={style}>▼</span>;
  }
  
  // Right-pointing triangle character
  return <span style={style}>▶</span>;
}
