import React, { useContext, useEffect } from 'react';
import { JobsContext } from '../context/JobsContext';

export default function JobsContextUtil({ series, overlay, instance }) {
  const { allSeriesState, setSeries } = useContext(JobsContext);
  const { overlayStatus, setOverlayStatus } = useContext(JobsContext);
  const { isInstance, setIsInstance } = useContext(JobsContext);

  useEffect(() => {
    setSeries(series);
  }, [series]);

  useEffect(() => {
    setOverlayStatus(overlay);
  }, [overlay]);

  useEffect(() => {
    setIsInstance(instance);
  }, [instance]);

  return null;
}
