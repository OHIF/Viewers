import React, { useState, createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const studyInstanceUIDsContext = createContext(null);
const { Provider } = studyInstanceUIDsContext;

export const useStudyInstanceUIDs = () => useContext(studyInstanceUIDsContext);

export function StudyInstanceUIDsProvider({ children, value: studyUID }) {
  const [studyInstanceUIDs, setStudyInstanceUIDs] = useState([studyUID]);

  return <Provider value={[studyInstanceUIDs]}>{children}</Provider>;
}

StudyInstanceUIDsProvider.propTypes = {
  children: PropTypes.any,
  value: PropTypes.any,
};

export default StudyInstanceUIDsProvider;
