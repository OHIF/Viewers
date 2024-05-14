import React, { useState } from 'react';
import Icon from '../Icon';
import InputRange from '../InputRange';
import CheckBox from '../CheckBox';
import InputNumber from '../InputNumber';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

const getRoundedValue = value => {
  return Math.round(value * 100) / 100;
};

const ActiveSegmentationConfig = ({
  config,
  setRenderOutline,
  setOutlineOpacityActive,
  setOutlineWidthActive,
  setRenderFill,
  setFillAlpha,
}) => {
  const { t } = useTranslation('SegmentationTable');
  return (
    <div className="flex justify-between gap-[5px] px-2 pt-[13px] text-[12px]">
      <div className="flex h-[89px] flex-col items-start">
        <div className="mb-[12px] text-white">{t('Active')}</div>
        <CheckBox
          label={t('Outline')}
          checked={config.renderOutline}
          labelClassName="text-[12px]"
          className="mb-[9px]"
          onChange={setRenderOutline}
        />
        <div className="mt-2"></div>
        <CheckBox
          label={t('Fill')}
          checked={config.renderFill}
          labelClassName="text-[12px]"
          className="mb-[9px]"
          onChange={setRenderFill}
        />
      </div>

      <div className="col-span-2 flex flex-col items-center">
        <div className="mb-[12px] text-[10px] text-[#b3b3b3]">{t('Opacity')}</div>
        <InputRange
          minValue={0}
          maxValue={100}
          value={getRoundedValue(config.outlineOpacity * 100)}
          onChange={setOutlineOpacityActive}
          step={1}
          containerClassName="mt-[4px] mb-[9px] w-[100px]"
          inputClassName="w-[64px]"
          labelClassName="text-white text-[12px] whitespace-nowrap"
          unit="%"
        />
        <InputRange
          minValue={0}
          maxValue={100}
          value={getRoundedValue(config.fillAlpha * 100)}
          onChange={setFillAlpha}
          step={1}
          containerClassName="mt-[4px] mb-[9px] w-[100px]"
          inputClassName="w-[64px]"
          labelClassName="text-white text-[12px] whitespace-nowrap"
          unit="%"
        />
      </div>

      <div className="flex flex-col items-center">
        <div className="mb-[12px] text-[10px] text-[#b3b3b3]">{t('Size')}</div>
        <InputNumber
          value={config.outlineWidthActive}
          onChange={setOutlineWidthActive}
          minValue={0}
          maxValue={10}
          className="-mt-1"
        />
      </div>
    </div>
  );
};

const InactiveSegmentationConfig = ({
  config,
  setRenderInactiveSegmentations,
  setFillAlphaInactive,
}) => {
  const { t } = useTranslation('SegmentationTable');
  return (
    <div className="px-3">
      <CheckBox
        label={t('Display inactive segmentations')}
        checked={config.renderInactiveSegmentations}
        labelClassName="text-[12px]"
        className="mb-[9px]"
        onChange={setRenderInactiveSegmentations}
      />

      <div className="flex items-center space-x-2 pl-4">
        <span className="text-[10px] text-[#b3b3b3]">{t('Opacity')}</span>
        <InputRange
          minValue={0}
          maxValue={100}
          value={getRoundedValue(config.fillAlphaInactive * 100)}
          onChange={setFillAlphaInactive}
          step={1}
          containerClassName="mt-[4px]"
          inputClassName="w-[64px]"
          labelClassName="text-white text-[12px]"
          unit="%"
        />
      </div>
    </div>
  );
};

const SegmentationConfig = ({
  segmentationConfig,
  setFillAlpha,
  setFillAlphaInactive,
  setOutlineWidthActive,
  setOutlineOpacityActive,
  setRenderFill,
  setRenderInactiveSegmentations,
  setRenderOutline,
}) => {
  const { t } = useTranslation('SegmentationTable');
  const { initialConfig } = segmentationConfig;
  const [isMinimized, setIsMinimized] = useState(true);
  return (
    <div className="bg-primary-dark select-none">
      <div>
        <ActiveSegmentationConfig
          config={initialConfig}
          setFillAlpha={setFillAlpha}
          setOutlineWidthActive={setOutlineWidthActive}
          setOutlineOpacityActive={setOutlineOpacityActive}
          setRenderFill={setRenderFill}
          setRenderOutline={setRenderOutline}
        />
        <div className="mx-1 mb-[8px] h-[1px] bg-[#212456]"></div>
        <div
          onClick={() => setIsMinimized(!isMinimized)}
          className="flex cursor-pointer items-center pl-2 pb-[9px]"
        >
          <Icon
            name="panel-group-open-close"
            className={classNames('h-5 w-5 cursor-pointer text-white transition duration-300', {
              'rotate-90 transform': !isMinimized,
            })}
          />
          <span className="text-[12px] font-[300] text-[#d8d8d8]">
            {t('Inactive segmentations')}
          </span>
        </div>
        {!isMinimized && (
          <InactiveSegmentationConfig
            config={initialConfig}
            setRenderInactiveSegmentations={setRenderInactiveSegmentations}
            setFillAlphaInactive={setFillAlphaInactive}
          />
        )}
      </div>
      <div className="h-[6px] bg-black "></div>
    </div>
  );
};

SegmentationConfig.propTypes = {};

export default SegmentationConfig;
