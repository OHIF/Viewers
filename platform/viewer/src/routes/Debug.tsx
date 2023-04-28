import React from 'react';
import { Icon } from '@ohif/ui';

// this is a debug component that is used to list various things that might
// be useful for debugging such as cross origin errors, etc.
function Debug() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div className="h-screen w-screen flex justify-center items-center ">
        <div className="py-8 px-8 mx-auto bg-secondary-dark drop-shadow-md space-y-2 rounded-lg">
          <img
            className="block mx-auto h-14"
            src="./ohif-logo.svg"
            alt="OHIF"
          />
          <div className="text-center space-y-2 pt-4">
            <div className="flex flex-col justify-center items-center">
              <p className="text-xl text-primary-active font-semibold mt-4">
                Debug Information
              </p>
              <div className="flex space-x-2 mt-4 items-center">
                <p className="text-md text-white">
                  Cross Origin Isolated (COOP/COEP)
                </p>
                <Icon
                  name={
                    window.crossOriginIsolated
                      ? 'notifications-success'
                      : 'notifications-error'
                  }
                  className="w-5 h-5"
                />
                {!window.crossOriginIsolated && (
                  <div className="text-md text-white flex-1">
                    We use SharedArrayBuffer to render volume data (e.g., MPR).
                    If you are seeing this message, it means that your browser
                    has not enabled COOP/COEP. Please see the following link for
                    more information:{' '}
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
