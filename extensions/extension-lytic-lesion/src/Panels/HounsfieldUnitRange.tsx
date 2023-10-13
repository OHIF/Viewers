import React from 'react';
import { Input, Label, Select, Button, ButtonGroup } from '@ohif/ui';
import { useTranslation } from 'react-i18next';
import WindowLevelPanel from './WindowLevelPanel';

const HOUNSFIELD_RANGE = 'hounsfield_range';

const options = [
  { value: HOUNSFIELD_RANGE, label: 'Hounsfield Range', placeHolder: 'Range' },
];

function HounsfieldRangeSelector({ commandsManager, servicesManager, extensionManager }) {
  const { t } = useTranslation('ROIThresholdConfiguration');
  const [targetNumber, setTargetNumber] = React.useState(233);
  const [minHU, setMinHU] = React.useState(-90);
  const [maxHU, setMaxHU] = React.useState(500);
  const [lowHU, setLowHU] = React.useState(73);
  const [highHU, setHighHU] = React.useState(365);

  const handleSetRange = () => {
    // Perform the action to set the Hounsfield range
    commandsManager.runCommand('setHounsfieldRange', {
      minHU: minHU,
      maxHU: maxHU,
      lowHU: lowHU,
      highHU: highHU,
      targetNumber: targetNumber,
    });
    commandsManager.runCommand('setColormap', { colormap: 'HUColormap' })
  };

  return (
    <div className="flex flex-col px-4 space-y-4 bg-primary-dark py-2">
      <div className="flex items-end space-x-2">
        <div>
          <Button
            size="medium"
            className="px-2 py-2 text-base text-white"
            color="primary"
            variant="outlined"
            onClick={handleSetRange}
          >
            {t('Set Viewport Range')}
          </Button>
        </div>
      </div>

      <div className="text-sm mr-2">
        <Label className="text-white" text="Hounsfield Unit Range" />
        <div className="flex justify-between">
          <Input
            label={t('Min HU')}
            labelClassName="text-white"
            className="mt-2 bg-black border-primary-main"
            type="text"
            containerClassName="mr-2"
            value={minHU}
            onChange={(e) => {
              setMinHU(parseInt(e.target.value));
            }}
          />
          <Input
            label={t('Max HU')}
            labelClassName="text-white"
            className="mt-2 bg-black border-primary-main"
            type="text"
            containerClassName="mr-2"
            value={maxHU}
            onChange={(e) => {
              setMaxHU(parseInt(e.target.value))
            }}
          />
        </div>
        <div className="flex justify-between">
          <Input
            label={t('Low HU')}
            labelClassName="text-white"
            className="mt-2 bg-black border-primary-main"
            type="text"
            containerClassName="mr-2"
            value={lowHU}
            onChange={(e) => {
              setLowHU(parseInt(e.target.value));
            }}
          />
          <Input
            label={t('High HU')}
            labelClassName="text-white"
            className="mt-2 bg-black border-primary-main"
            type="text"
            containerClassName="mr-2"
            value={highHU}
            onChange={(e) => {
              setHighHU(parseInt(e.target.value))
            }}
          />
        </div>
      </div>

      <div className="text-sm mr-2">
        <Label className="text-white" />
        <Input
          label={t('Maximal Color')}
          labelClassName="text-white"
          className="mt-2 bg-black border-primary-main"
          type="text"
          containerClassName="mr-2"
          value={targetNumber}
          onChange={(e) => setTargetNumber(parseInt(e.target.value))}
        />
      </div>
      <WindowLevelPanel
        extensionManager={extensionManager}
        servicesManager={servicesManager}
      ></WindowLevelPanel>
    </div>
  );
}

export default HounsfieldRangeSelector;
