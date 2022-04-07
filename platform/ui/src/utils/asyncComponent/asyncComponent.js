import React, { useState, useEffect } from 'react';
import { ErrorPage } from '@ohif/ui';

export const retryImport = (fn, retriesLeft = 5, interval = 1000) =>
  new Promise((resolve, reject) => {
    fn().then(resolve).catch((error) => {
      setTimeout(() => {
        if (retriesLeft === 1) {
          /* reject('maximum retries exceeded'); */
          reject(error);
          return;
        }

        /* Passing on "reject" is the important part */
        retry(fn, retriesLeft - 1, interval).then(resolve, reject);
      }, interval);
    });
  });

const onError = (error, setState) => setState({ component: ErrorPage });

/**
 * We use this function to lazy load the import of a component to leverage 'Code Splitting'
 * Link: https://serverless-stack.com/chapters/code-splitting-in-create-react-app.html
 */
const asyncComponent = (importComponent, options = { onError }) => props => {
  const [state, setState] = useState({ component: null });

  const isFunction = item => typeof item === 'function';
  const isChunkError = error => error.toString().indexOf('ChunkLoadError') > -1;

  useEffect(() => {
    const addDynamicallyLoadedComponentToState = async () => {
      try {
        const { default: component } = await importComponent();
        setState({ component });
        if (options.onLoaded && isFunction(options.onLoaded)) {
          options.onLoaded(component);
        }
      } catch (error) {
        console.error('[AsyncComponent] Failed to import chunk:', error);

        if (options.onError && isFunction(options.onError)) {
          options.onError(error, setState);
          return;
        }

        if (isChunkError(error)) {
          console.error('[AsyncComponent] Reloading due to chunk error');
          window.location.reload();
        }
      }
    };

    addDynamicallyLoadedComponentToState();
  }, []);

  const Component = state.component;
  return Component ? <Component {...props} /> : null;
};

export default asyncComponent;
