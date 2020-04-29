import React from 'react';
import { Link } from 'react-router-dom';

const StudyListContainer = () => {
  return (
    <div>
      <div>StudyListContainer</div>
      <Link to="/viewer/123">Go to Viewer Route</Link>
    </div>
  );
};

export default StudyListContainer;
