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
    <div className="bg-primary-dark flex flex-col space-y-4">
      <div className="flex items-end space-x-4">
        <div className="flex flex-1 min-w-0 flex-col">
          <Label className="mb-1">{t('Strategy')}</Label>
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
        <div className="mr-2">
          <Label className="mb-1">{t('Percentage of Max SUV')}</Label>
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
          <table>
            <tbody>
              <tr className="mt-2">
                <td
                  className="pr-4"
                  colSpan="3"
                >
                  <Label className="pr-4">Lower & Upper Ranges</Label>
                </td>
              </tr>
              <tr className="mt-2">
                <td className="pr-4 pt-2 text-center">
                  <Label className="pr-4">CT</Label>
                </td>
                <td>
                  <div className="flex justify-between">
                    <div className="mr-2 mt-2">
                      <Input
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
                    <div className="mr-2 mt-2">
                      <Input
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
                </td>
              </tr>
              <tr>
                <td className="pr-4 pt-2 text-center">
                  <Label className="pr-4">PT</Label>
                </td>
                <td>
                  <div className="flex justify-between">
                    <div className="mr-2 mt-2">
                      <Input
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
                    <div className="mr-2 mt-2">
                      <Input
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ROIThresholdConfiguration;