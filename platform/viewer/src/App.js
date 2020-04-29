import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ThemeWrapper } from '@ohif/ui';

import routes from './routes';

const App = () => {
  const Router = JSON.parse(process.env.USE_HASH_ROUTER)
    ? HashRouter
    : BrowserRouter;
  return (
    <Router>
      <ThemeWrapper>{routes()}</ThemeWrapper>
    </Router>
  );
};

export default App;
