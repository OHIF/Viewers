import React from 'react';
import classnames from 'classnames';
import { useNavigate } from 'react-router-dom';

import { Button } from '@ohif/ui';

function DataSourceSelector() {
  console.log('Rendering multi-data sources initial page');
  const navigate = useNavigate();

  const dsConfigs = window.config.dataSources;

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
            {dsConfigs
              .filter(
                it =>
                  it.sourceName !== 'dicomjson' &&
                  it.sourceName !== 'dicomlocal'
              )
              .map(ds => (
                <>
                  <h1 className="text-white">{ds.friendlyName}</h1>
                  <Button
                    className={classnames('font-bold', 'ml-2')}
                    onClick={() => {
                      navigate({
                        pathname: '/',
                        search: `datasources=${ds.sourceName}`,
                      });
                    }}
                  >
                    {ds.sourceName}
                  </Button>
                  <br />
                </>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataSourceSelector;
