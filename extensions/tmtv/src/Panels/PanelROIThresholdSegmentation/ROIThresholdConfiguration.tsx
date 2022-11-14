import React from 'react';
import { Input, Select, Button, ButtonGroup } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

export const ROI_STAT = 'roi_stat';
const RANGE = 'range';

const options = [
  { value: ROI_STAT, label: 'Max', placeHolder: 'Max' },
  { value: RANGE, label: 'Range', placeHolder: 'Range' },
];

function ROIThresholdConfiguration({ config, dispatch, runCommand }) {
  const { t } = useTranslation('ROIThresholdConfiguration');

  return (
    <div className="flex flex-col px-4 space-y-4 bg-primary-dark">
      <div className="flex items-end space-x-2">
        <div className="flex flex-col w-1/2 mt-2 ">
          <Select
            label={t('Strategy')}
            closeMenuOnSelect={true}
            className="mr-2 bg-black border-primary-main "
            options={options}
            placeholder={
              options.find(option => option.value === config.strategy)
                .placeHolder
            }
            value={config.strategy}
            onChange={({ value }) => {
              dispatch({
                type: 'setStrategy',
                payload: {
                  strategy: value,
                },
              });
            }}
          />
        </div>
        <div className="w-1/2">
          <ButtonGroup>
            <Button
              size="initial"
              className="px-2 py-2 text-base text-white"
              color="primaryLight"
              variant="outlined"
              onClick={() => runCommand('setStartSliceForROIThresholdTool')}
            >
              {t('Start')}
            </Button>
            <Button
              size="initial"
              color="primaryLight"
              variant="outlined"
              className="px-2 py-2 text-base text-white"
              onClick={() => runCommand('setEndSliceForROIThresholdTool')}
            >
              {t('End')}
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {config.strategy === ROI_STAT && (
        <Input
          label={t('Percentage of Max SUV')}
          labelClassName="text-white"
          className="mt-2 bg-black border-primary-main"
          type="text"
          containerClassName="mr-2"
          value={config.weight}
          onChange={e => {
            dispatch({
              type: 'setWeight',
              payload: e.target.value,
            });
          }}
        />
      )}
      {config.strategy !== ROI_STAT && (
        <div className="flex justify-between">
          <Input
            label={t('Lower')}
            labelClassName="text-white"
            className="mt-2 bg-black border-primary-main"
            type="text"
            containerClassName="mr-2"
            value={config.lower}
            onChange={e => {
              dispatch({
                type: 'setThreshold',
                payload: {
                  lower: e.target.value,
                },
              });
            }}
          />
          <Input
            label={t('Upper')}
            labelClassName="text-white"
            className="mt-2 bg-black border-primary-main"
            type="text"
            containerClassName="mr-2"
            value={config.upper}
            onChange={e => {
              dispatch({
                type: 'setThreshold',
                payload: {
                  upper: e.target.value,
                },
              });
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ROIThresholdConfiguration;
