import { useEffect } from 'react';
import OHIF from '@ohif/core';

const { StudyLoadingListener } = OHIF.classes;

const StudyLoadingMonitor = ({ studies }) => {
  useEffect(() => {
    const studyLoadingListener = StudyLoadingListener.getInstance();

    if (studies && studies.length > 0) {
      studyLoadingListener.clear();
      studyLoadingListener.addStudies(studies);
    }

    return () => {
      studyLoadingListener.clear();
    };
  }, [studies]);

  return null;
};

export default StudyLoadingMonitor;
