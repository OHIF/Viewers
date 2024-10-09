import React from 'react';
import { Slider, Switch, Input, Tabs, TabsList, TabsTrigger } from '../../components';
import { Icons } from '../Icons';
import { useTranslation } from 'react-i18next';
import { PanelSection } from '../PanelSection/PanelSection';

interface SegmentationConfigProps {
  config: {
    renderFill: boolean;
    renderOutline: boolean;
    outlineOpacity: number;
    fillAlpha: number;
    outlineWidth: number;
    renderInactiveSegmentations: boolean;
    fillAlphaInactive: number;
  };
  setRenderFill: (value: boolean) => void;
  setRenderOutline: (value: boolean) => void;
  setOutlineOpacity: (value: number) => void;
  setFillAlpha: (value: number) => void;
  setOutlineWidth: (value: number) => void;
  setRenderInactiveSegmentations: (value: boolean) => void;
  setFillAlphaInactive: (value: number) => void;
}

const SegmentationConfig: React.FC<SegmentationConfigProps> = ({
  config,
  setRenderFill,
  setRenderOutline,
  setOutlineOpacity,
  setFillAlpha,
  setOutlineWidth,
  setRenderInactiveSegmentations,
  setFillAlphaInactive,
}) => {
  const { t } = useTranslation('SegmentationTable');
  const [selectedTab, setSelectedTab] = React.useState('fill-and-outline');

  return (
    <PanelSection
      title={t('Appearance Settings')}
      icon="Settings"
      defaultOpen={false}
      headerClassName="px-2 py-1"
    >
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <span className="text-aqua-pale">
            {t('Show')}:{' '}
            {selectedTab === 'fill-and-outline'
              ? t('Fill & Outline')
              : selectedTab === 'outline'
                ? t('Outline Only')
                : t('Fill Only')}
          </span>
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
          >
            <TabsList>
              <TabsTrigger value="fill-and-outline">
                <Icons.FillAndOutline className="text-primary-active" />
              </TabsTrigger>
              <TabsTrigger value="outline">
                <Icons.OutlineOnly className="text-primary-active" />
              </TabsTrigger>
              <TabsTrigger value="fill">
                <Icons.FillOnly className="text-primary-active" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-aqua-pale">{t('Opacity')}</span>
            <Slider
              value={[config.fillAlpha * 100]}
              onValueChange={([value]) => setFillAlpha(value / 100)}
              max={100}
              step={1}
              className="w-3/4"
            />
            <Input
              value={Math.round(config.fillAlpha * 100)}
              onChange={e => setFillAlpha(Number(e.target.value) / 100)}
              className="w-12 text-center"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-aqua-pale">{t('Border')}</span>
            <Slider
              value={[config.outlineWidth]}
              onValueChange={([value]) => setOutlineWidth(value)}
              max={10}
              step={1}
              className="w-3/4"
            />
            <Input
              value={config.outlineWidth}
              onChange={e => setOutlineWidth(Number(e.target.value))}
              className="w-12 text-center"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-aqua-pale">{t('Sync changes in all viewports')}</span>
          <Switch
            checked={true}
            onCheckedChange={() => {}}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-aqua-pale">{t('Display inactive segmentations')}</span>
          <Switch
            checked={config.renderInactiveSegmentations}
            onCheckedChange={setRenderInactiveSegmentations}
          />
        </div>

        {config.renderInactiveSegmentations && (
          <div className="flex items-center justify-between">
            <span className="text-aqua-pale">{t('Opacity')}</span>
            <Slider
              value={[config.fillAlphaInactive * 100]}
              onValueChange={([value]) => setFillAlphaInactive(value / 100)}
              max={100}
              step={1}
              className="w-3/4"
            />
            <Input
              value={Math.round(config.fillAlphaInactive * 100)}
              onChange={e => setFillAlphaInactive(Number(e.target.value) / 100)}
              className="w-12 text-center"
            />
          </div>
        )}
      </div>
    </PanelSection>
  );
};

export default SegmentationConfig;
