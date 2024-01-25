import React, { useState, useEffect, } from 'react';
import { utils } from '@ohif/core';

const { formatPN } = utils;

export default function MultiMonitorLayout(props) {
  const { studyData } = props;
  if (!studyData) return null;

  return (<div style={{ background: 'yellow', color: 'green', width: '100%' }}>

    <p>{formatPN(studyData.PatientName)} ID:{studyData.PatientID} Acc#:{studyData.AccessionNumber} </p>
  </div>);
}
