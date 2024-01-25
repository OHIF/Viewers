import React, { useState, useEffect, useMemo } from 'react';

import PrimaryStudyLayout from './PrimaryStudyLayout';
import PriorsList from './PriorsList';

export default function MultiMonitorLayout(props) {
  return (<div style={{ background: 'red', color: 'green', }}>
    <PrimaryStudyLayout {...props} />
    <PriorsList {...props} />
  </div>);
}
