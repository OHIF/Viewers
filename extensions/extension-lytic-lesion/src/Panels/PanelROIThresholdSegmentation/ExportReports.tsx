import React from 'react';
import { Button, ButtonGroup } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

function ExportReports({ segmentations, tmtvValue, config, commandsManager }) {
  const { t } = useTranslation('PanelSUVExport');

  return (
    <>
      {segmentations?.length ? (
        <div className="flex justify-center mt-4 space-x-2">
          <ButtonGroup color="black" size="inherit">
            <Button
              className="px-2 py-2 text-base"
              disabled={tmtvValue === null}
              onClick={() => {
                commandsManager.runCommand('exportTMTVReportCSV', {
                  segmentations,
                  tmtv: tmtvValue,
                  config,
                });
              }}
            >
              {t('Export CSV')}
            </Button>
          </ButtonGroup>
          <ButtonGroup color="black" size="inherit">
            <Button
              className="px-2 py-2 text-base"
              onClick={() => {
                commandsManager.runCommand('createTMTVRTReport');
              }}
              disabled={tmtvValue === null}
            >
              {t('Create RT Report')}
            </Button>
          </ButtonGroup>
        </div>
      ) : null}
    </>
  );
}

export default ExportReports;
