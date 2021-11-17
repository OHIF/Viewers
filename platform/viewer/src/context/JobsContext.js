//chatcontextprovider
import * as React from 'react';
import { useEffect, useState } from 'react';

export const JobsContext = React.createContext({});

const JobsContextProvider = ({ children, series }) => {
  const [allSeriesState, setSeries] = useState([]);

  return (
    <JobsContext.Provider
      value={{
        allSeriesState,
        setSeries,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
};

export default JobsContextProvider;
