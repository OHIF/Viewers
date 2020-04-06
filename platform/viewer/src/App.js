import React from 'react';
import { ThemeWrapper, Viewer } from '@ohif/ui';

import ConnectedStudyList from './connectedComponents/ConnectedStudyList';

const App = () => {
  return (
    <ThemeWrapper>
      <Viewer />
    </ThemeWrapper>
  );
};

export default App;
