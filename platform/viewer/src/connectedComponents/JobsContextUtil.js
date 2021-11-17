import React, { useContext, useEffect } from 'react';
import { JobsContext } from '../context/JobsContext';

export default function JobsContextUtil({ series }) {
  const { allSeriesState, setSeries } = useContext(JobsContext);

  useEffect(() => {
    setSeries(series);
  }, [series]);

  return null;
}
