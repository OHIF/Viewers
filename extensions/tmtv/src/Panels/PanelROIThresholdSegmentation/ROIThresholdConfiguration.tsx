import React from 'react';
import { Input, Label, LegacyButton, LegacyButtonGroup } from '@ohif/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ohif/ui-next';
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
      <div className="flex items-end space-x-2">
        <div className="flex w-1/2 flex-col">
          <Label className="font-inter mb-1 text-[13px] text-white">{t('Strategy')}</Label>
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
            <SelectTrigger className="">
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
        <div className="w-1/2">
          {/* TODO Revisit design of LegacyButtonGroup later - for now use LegacyButton for its children.*/}
          <LegacyButtonGroup>
            <LegacyButton
              size="initial"
              className="px-2 py-2 text-base text-white"
              color="primaryLight"
              variant="outlined"
              onClick={() => runCommand('setStartSliceForROIThresholdTool')}
            >
              {t('Start')}
            </LegacyButton>
            <LegacyButton
              size="initial"
              color="primaryLight"
              variant="outlined"
              className="px-2 py-2 text-base text-white"
              onClick={() => runCommand('setEndSliceForROIThresholdTool')}
            >
              {t('End')}
            </LegacyButton>
          </LegacyButtonGroup>
        </div>
      </div>

      {config.strategy === ROI_STAT && (
        <Input
          label={t('Percentage of Max SUV')}
          labelClassName="text-[13px] font-inter text-white"
          className="border-primary-main bg-black"
          type="text"
          containerClassName="mr-2"
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
                  <Label
                    className="font-inter text-[13px] text-white"
                    text="Lower & Upper Ranges"
                  ></Label>
                </td>
              </tr>
              <tr className="mt-2">
                <td className="pr-4 pt-2 text-center">
                  <Label
                    className="text-white"
                    text="CT"
                  ></Label>
                </td>
                <td>
                  <div className="flex justify-between">
                    <Input
                      label={t('')}
                      labelClassName="text-white"
                      className="border-primary-main mt-2 bg-black"
                      type="text"
                      containerClassName="mr-2"
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
                    <Input
                      label={t('')}
                      labelClassName="text-white"
                      className="border-primary-main mt-2 bg-black"
                      type="text"
                      containerClassName="mr-2"
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
                </td>
              </tr>
              <tr>
                <td className="pr-4 pt-2 text-center">
                  <Label
                    className="text-white"
                    text="PT"
                  ></Label>
                </td>
                <td>
                  <div className="flex justify-between">
                    <Input
                      label={t('')}
                      labelClassName="text-white"
                      className="border-primary-main mt-2 bg-black"
                      type="text"
                      containerClassName="mr-2"
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
                    <Input
                      label={t('')}
                      labelClassName="text-white"
                      className="border-primary-main mt-2 bg-black"
                      type="text"
                      containerClassName="mr-2"
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
