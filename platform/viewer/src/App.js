import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeWrapper } from '@ohif/ui';

import routes from './routes';

const App = () => {
  return (
    <BrowserRouter>
      <ThemeWrapper>{routes()}</ThemeWrapper>
    </BrowserRouter>
  );
};

export default App;
