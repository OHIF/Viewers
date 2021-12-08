import * as React from 'react';
import { useEffect, useState } from 'react';

export const JobsContext = React.createContext({});

const JobsContextProvider = ({ children, series, overlay, instance }) => {
  const [allSeriesState, setSeries] = useState([]);
  const [overlayStatus, setOverlayStatus] = useState(overlay);
  const [isInstance, setIsInstance] = useState(instance);
  const [opacityStatus, setOpacityStatus] = useState(0.5);
  const [colorMapStatus, setColorMapStatus] = useState('hotIron');

  // useEffect(() => {
  //   console.log('JobsContext Effect ', {
  //     allSeriesState,
  //     overlayStatus,
  //     isInstance,
  //     opacityStatus,
  //     colorMapStatus,
  //   });
  // }, [
  //   allSeriesState,
  //   overlayStatus,
  //   isInstance,
  //   opacityStatus,
  //   colorMapStatus,
  // ]);

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
      }}
    >
      {children}
    </JobsContext.Provider>
  );
};

export default JobsContextProvider;
