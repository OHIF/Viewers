import React, { useContext, useEffect } from 'react';
import { JobsContext } from '../context/JobsContext';

export default function JobsContextUtil({
  series,
  overlay,
  instance,
  isLoading = false,
}) {
  const { allSeriesState, setSeries } = useContext(JobsContext);
  const { overlayStatus, setOverlayStatus } = useContext(JobsContext);
  const { isInstance, setIsInstance } = useContext(JobsContext);
  const { setLoading } = useContext(JobsContext);
  // const { opacityStatus, setOpacityStatus } = useContext(JobsContext);
  // const { colorMapStatus, setColorMapStatus } = useContext(JobsContext);

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
    setLoading(isLoading);
  }, [isLoading]);

  // useEffect(() => {
  //   setOpacityStatus(opacity);
  // }, [opacity]);

  // useEffect(() => {
  //   setColorMapStatus(colormap);
  // }, [colormap]);

  return null;
}
