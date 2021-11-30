import React, { useContext, useEffect } from 'react';
import { JobsContext } from '../context/JobsContext';

export default function JobsContextUtil({ series, overlay }) {
  const { allSeriesState, setSeries } = useContext(JobsContext);
  const { overlayStatus, setOverlayStatus } = useContext(JobsContext);

  useEffect(() => {
    setSeries(series);
  }, [series]);

  useEffect(() => {
    console.log({ overlay });
    setOverlayStatus(overlay);
  }, [overlay]);

  return null;
}
