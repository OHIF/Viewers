import React from 'react';
import classnames from 'classnames';
import { useNavigate } from 'react-router-dom';
import { useAppConfig } from '@state';

import { Button, ButtonEnums } from '@ohif/ui';

function DataSourceSelector() {
  const [appConfig] = useAppConfig();
  const navigate = useNavigate();

  // This is frowned upon, but the raw config is needed here to provide
  // the selector
  const dsConfigs = appConfig.dataSources;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="bg-secondary-dark mx-auto space-y-2 rounded-lg py-8 px-8 drop-shadow-md">
          <img
            className="mx-auto block h-14"
            src="./ohif-logo.svg"
            alt="OHIF"
          />
          <div className="space-y-2 pt-4 text-center">
            {dsConfigs
              .filter(it => it.sourceName !== 'dicomjson' && it.sourceName !== 'dicomlocal')
              .map(ds => (
                <div key={ds.sourceName}>
                  <h1 className="text-white">
                    {ds.configuration?.friendlyName || ds.friendlyName}
                  </h1>
                  <Button
                    type={ButtonEnums.type.primary}
                    className={classnames('ml-2')}
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
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataSourceSelector;
