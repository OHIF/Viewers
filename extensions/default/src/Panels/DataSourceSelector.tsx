import React from 'react';
import classnames from 'classnames';
import { useNavigate } from 'react-router-dom';

import { Button } from '@ohif/ui';

function DataSourceSelector() {
  console.log('Rendering multi-data sources initial page');
  const navigate = useNavigate();

  const dsConfigs = window.config.dataSources;

  return (
    <div className="bg-black border-primary-main text-white">
      {dsConfigs
        .filter(
          it => it.sourceName !== 'dicomjson' && it.sourceName !== 'dicomlocal'
        )
        .map(ds => (
          <>
            <h1>{ds.friendlyName}</h1>
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
  );
}

export default DataSourceSelector;
