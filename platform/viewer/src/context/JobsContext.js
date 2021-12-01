import * as React from 'react';
import { useEffect, useState } from 'react';

export const JobsContext = React.createContext({});

const JobsContextProvider = ({ children, series, overlay, instance }) => {
  const [allSeriesState, setSeries] = useState([]);
  const [overlayStatus, setOverlayStatus] = useState(overlay);
  const [isInstance, setIsInstance] = useState(instance);

  return (
    <JobsContext.Provider
      value={{
        allSeriesState,
        setSeries,
        overlayStatus,
        setOverlayStatus,
        isInstance,
        setIsInstance,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
};

export default JobsContextProvider;
