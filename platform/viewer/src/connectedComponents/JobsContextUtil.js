import React, { useContext, useEffect } from 'react';
import { JobsContext } from '../context/JobsContext';

export default function JobsContextUtil({ series, overlay, instance, opacity, colormap, job }) {
  const { allSeriesState, setSeries } = useContext(JobsContext);
  const { overlayStatus, setOverlayStatus } = useContext(JobsContext);
  const { isInstance, setIsInstance } = useContext(JobsContext);
  const { opacityStatus, setOpacityStatus } = useContext(JobsContext);
  const { colorMapStatus, setColorMapStatus } = useContext(JobsContext);
  const { jobDetails, setJobDetails } = useContext(JobsContext);

  useEffect(() => {
    setSeries(series);
  }, [series]);

  useEffect(() => {
    setOverlayStatus(overlay);
  }, [overlay]);

  useEffect(() => {
    setIsInstance(instance);
  }, [instance]);

  useEffect(() => {
    setOpacityStatus(opacity);
  }, [opacity]);

  useEffect(() => {
    setColorMapStatus(colormap);
  }, [colormap]);

  useEffect(() => {
    setJobDetails(job);
  }, [job]);

  return null;
}
