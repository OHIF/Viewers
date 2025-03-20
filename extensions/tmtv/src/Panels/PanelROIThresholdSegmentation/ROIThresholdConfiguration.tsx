import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Input,
  Button,
} from '@ohif/ui-next';
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
    <div className="bg-primary-dark flex flex-col space-y-4 p-px">
      <div className="flex items-end space-x-3">
        <div className="flex min-w-0 flex-1 flex-col">
          {/* The original panel design does not include "Strategy," but it was found in the code.
    Need to determine if it should be included or removed.
          <Label className="my-2">{t('Strategy')}</Label>  */}
          <Select
            value={config.strategy}
            onValueChange={value => {
              dispatch({
                type: 'setStrategy',
                payload: {
                  strategy: value,
                },
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={options.find(option => option.value === config.strategy)?.placeHolder}
              />
            </SelectTrigger>
            <SelectContent className="">
              {options.map(option => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-shrink-0">
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => runCommand('setStartSliceForROIThresholdTool')}
            >
              {t('Start')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => runCommand('setEndSliceForROIThresholdTool')}
            >
              {t('End')}
            </Button>
          </div>
        </div>
      </div>

      {config.strategy === ROI_STAT && (
        <div className="mr-0">
          <div className="mb-2">
            <Label>{t('Percentage of Max SUV')}</Label>
          </div>
          <Input
            className="w-full"
            type="text"
            value={config.weight}
            onChange={e => {
              dispatch({
                type: 'setWeight',
                payload: {
                  weight: e.target.value,
                },
              });
            }}
          />
        </div>
      )}
      {config.strategy !== ROI_STAT && (
        <div className="mr-2 text-sm">
          <div className="flex flex-col space-y-2">
            {/* Header */}
            <Label>Lower & Upper Ranges</Label>

            {/* CT Row */}
            <div className="flex items-center">
              <div className="w-10 text-left">
                <Label>CT</Label>
              </div>
              <div className="flex flex-1 space-x-2">
                <div className="flex-1">
                  <Input
                    className="w-full"
                    type="text"
                    value={config.ctLower}
                    onChange={e => {
                      dispatch({
                        type: 'setThreshold',
                        payload: {
                          ctLower: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    className="w-full"
                    type="text"
                    value={config.ctUpper}
                    onChange={e => {
                      dispatch({
                        type: 'setThreshold',
                        payload: {
                          ctUpper: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            </div>

            {/* PT Row */}
            <div className="flex items-center">
              <div className="w-10 text-left">
                <Label>PT</Label>
              </div>
              <div className="flex flex-1 space-x-2">
                <div className="flex-1">
                  <Input
                    className="w-full"
                    type="text"
                    value={config.ptLower}
                    onChange={e => {
                      dispatch({
                        type: 'setThreshold',
                        payload: {
                          ptLower: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    className="w-full"
                    type="text"
                    value={config.ptUpper}
                    onChange={e => {
                      dispatch({
                        type: 'setThreshold',
                        payload: {
                          ptUpper: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ROIThresholdConfiguration;
