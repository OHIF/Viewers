//chatcontextprovider
import * as React from "react";
import { useEffect, useState} from "react";

export const JobsContext = React.createContext({});

const JobsContextProvider= ({ children, series }) => {
  const [allSeriesState, setSeries] = useState([]);

  useEffect(() => {
    console.log({series})
    if (series && series.length > 0) {
      console.log('set series', allSeriesState)
      setSeries([...series])
    }
  }, [series])

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
