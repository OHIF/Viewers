import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ThemeWrapper } from '@ohif/ui';

import routes from './routes';

const App = () => {
  const RouterComponent = JSON.parse(process.env.USE_HASH_ROUTER)
    ? HashRouter
    : BrowserRouter;
  return (
    <RouterComponent>
      <ThemeWrapper>{routes()}</ThemeWrapper>
    </RouterComponent>
  );
};

export default App;
