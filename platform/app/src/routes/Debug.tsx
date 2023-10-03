import React from 'react';
import { Icon } from '@ohif/ui';

// this is a debug component that is used to list various things that might
// be useful for debugging such as cross origin errors, etc.
function Debug() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div className="flex h-screen w-screen items-center justify-center ">
        <div className="bg-secondary-dark mx-auto space-y-2 rounded-lg py-8 px-8 drop-shadow-md">
          <img
            className="mx-auto block h-14"
            src="./ohif-logo.svg"
            alt="OHIF"
          />
          <div className="space-y-2 pt-4 text-center">
            <div className="flex flex-col items-center justify-center">
              <p className="text-primary-active mt-4 text-xl font-semibold">Debug Information</p>
              <div className="mt-4 flex items-center space-x-2">
                <p className="text-md text-white">Cross Origin Isolated (COOP/COEP)</p>
                <Icon
                  name={
                    window.crossOriginIsolated ? 'notifications-success' : 'notifications-error'
                  }
                  className="h-5 w-5"
                />
                {!window.crossOriginIsolated && (
                  <div className="text-md flex-1 text-white">
                    We use SharedArrayBuffer to render volume data (e.g., MPR). If you are seeing
                    this message, it means that your browser has not enabled COOP/COEP. Please see
                    the following link for more information:{' '}
                    <a
                      href="https://web.dev/coop-coep/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-active"
                    >
                      Learn More
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Debug;
