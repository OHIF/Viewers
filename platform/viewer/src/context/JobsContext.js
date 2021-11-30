//chatcontextprovider
import * as React from 'react';
import { useEffect, useState } from 'react';

export const JobsContext = React.createContext({});

const JobsContextProvider = ({ children, series, overlay }) => {
  const [allSeriesState, setSeries] = useState([]);
  const [overlayStatus, setOverlayStatus] = useState(false);

  return (
    <JobsContext.Provider
      value={{
        allSeriesState,
        setSeries,
        overlayStatus,
        setOverlayStatus,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
};

export default JobsContextProvider;
