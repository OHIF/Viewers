import * as React from 'react';
import { useEffect, useState } from 'react';

export const JobsContext = React.createContext({});

const JobsContextProvider = ({
  children,
  series,
  overlay,
  instance,
  opacity,
  colormap,
  job
}) => {
  const [allSeriesState, setSeries] = useState([]);
  const [overlayStatus, setOverlayStatus] = useState(overlay);
  const [isInstance, setIsInstance] = useState(instance);
  const [opacityStatus, setOpacityStatus] = useState(opacity);
  const [colorMapStatus, setColorMapStatus] = useState(colormap);
  const [jobDetails, setJobDetails] = useState(job);

  return (
    <JobsContext.Provider
      value={{
        allSeriesState,
        setSeries,
        overlayStatus,
        setOverlayStatus,
        isInstance,
        setIsInstance,
        opacityStatus,
        setOpacityStatus,
        colorMapStatus,
        setColorMapStatus,
        jobDetails,
        setJobDetails,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
};

export default JobsContextProvider;
