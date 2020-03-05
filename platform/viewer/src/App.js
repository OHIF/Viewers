import React from 'react';
import { ThemeWrapper } from '@ohif/ui';

import ConnectedStudyList from './connectedComponents/ConnectedStudyList';

const App = () => {
  return (
    <ThemeWrapper>
      <ConnectedStudyList />
    </ThemeWrapper>
  );
};

export default App;
