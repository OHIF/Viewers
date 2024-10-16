import React from 'react';
import { Slider, Switch, Input, Tabs, TabsList, TabsTrigger } from '../../components';
import { Icons } from '../Icons';
import { useTranslation } from 'react-i18next';
import { PanelSection } from '../PanelSection/PanelSection';
import { Label } from '../../components';

interface SegmentationConfigProps {
  representation: unknown;
  setFillAlpha: (value: number) => void;
  setOutlineWidth: (value: number) => void;
  toggleRenderInactiveSegmentations: () => void;
  renderInactiveSegmentations: boolean;
  setFillAlphaInactive: (value: number) => void;
  setRenderFill: (value: boolean) => void;
  setRenderOutline: (value: boolean) => void;
}

const SegmentationConfig: React.FC<SegmentationConfigProps> = ({
  representation,
  setFillAlpha,
  setOutlineWidth,
  toggleRenderInactiveSegmentations,
  renderInactiveSegmentations,
  setFillAlphaInactive,
  setRenderFill,
  setRenderOutline,
}) => {
  const { t } = useTranslation('SegmentationTable');

  const { fillAlpha, fillAlphaInactive, outlineWidth, renderFill, renderOutline } =
    representation.styles;

  return (
    <PanelSection
      title={t('Appearance Settings')}
      icon="Settings"
      defaultOpen={false}
      headerClassName="px-2 py-1"
    >
      <div className="bg-muted mb-0.5 space-y-2 rounded-b px-1.5 pt-0.5 pb-3">
        <div className="my-1 flex items-center justify-between">
          <span className="text-aqua-pale text-xs">
            {t('Show')}:{' '}
            {renderFill && renderOutline
              ? t('Fill & Outline')
              : renderOutline
                ? t('Outline Only')
                : t('Fill Only')}
          </span>
          <Tabs
            value={
              renderFill && renderOutline ? 'fill-and-outline' : renderOutline ? 'outline' : 'fill'
            }
            onValueChange={value => {
              if (value === 'fill-and-outline') {
                setRenderFill(true);
                setRenderOutline(true);
              } else if (value === 'outline') {
                setRenderFill(false);
                setRenderOutline(true);
              } else {
                setRenderFill(true);
                setRenderOutline(false);
              }
            }}
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
          <div className="my-2 flex items-center">
            <Label className="text-muted-foreground w-14 flex-none whitespace-nowrap text-xs">
              Opacity
            </Label>
            <Slider
              className="mx-1 flex-1"
              value={[fillAlpha]}
              onValueChange={([value]) => setFillAlpha(value)}
              max={1}
              min={0}
              step={0.1}
            />
            <Input
              className="mx-1 w-10 flex-none"
              value={fillAlpha}
              onChange={e => setFillAlpha(Number(e.target.value))}
            />
          </div>

          <div className="my-2 flex items-center">
            <Label className="text-muted-foreground w-14 flex-none whitespace-nowrap text-xs">
              {t('Border')}
            </Label>
            <Slider
              value={[outlineWidth]}
              onValueChange={([value]) => setOutlineWidth(value)}
              max={10}
              min={0}
              step={0.1}
              className="mx-1 flex-1"
            />
            <Input
              value={outlineWidth}
              onChange={e => setOutlineWidth(Number(e.target.value))}
              className="mx-1 w-10 flex-none text-center"
            />
          </div>
        </div>

        <div className="border-input w-full border"></div>

        <div className="my-2 flex items-center pl-1">
          <Switch
            checked={renderInactiveSegmentations}
            onCheckedChange={toggleRenderInactiveSegmentations}
          />
          <Label className="text-muted-foreground mx-2 text-xs">
            {t('Display inactive segmentations')}
          </Label>
        </div>
        {renderInactiveSegmentations && (
          <div className="my-2 flex items-center">
            <Label className="text-muted-foreground w-14 flex-none whitespace-nowrap text-xs">
              Opacity
            </Label>
            <Slider
              className="mx-1 flex-1"
              value={[fillAlphaInactive]}
              onValueChange={([value]) => setFillAlphaInactive(value)}
              max={1}
              min={0}
              step={0.1}
            />
            <Input
              className="mx-1 w-10 flex-none"
              value={fillAlphaInactive}
              onChange={e => setFillAlphaInactive(Number(e.target.value))}
            />
          </div>
        )}
      </div>
    </PanelSection>
  );
};

export default SegmentationConfig;
