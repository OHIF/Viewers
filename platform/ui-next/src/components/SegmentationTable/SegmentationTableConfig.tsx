import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger } from '../Tabs';
import { Slider } from '../Slider';
import { Icons } from '../Icons';
import { Switch } from '../Switch';
import { Label } from '../Label';
import { Input } from '../Input';
import { useSegmentationTableContext } from './contexts';

export const SegmentationTableConfig: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation('SegmentationPanel');
  const {
    renderFill,
    renderOutline,
    setRenderFill,
    setRenderFillInactive,
    setRenderOutline,
    setRenderOutlineInactive,
    fillAlpha,
    fillAlphaInactive,
    outlineWidth,
    setFillAlpha,
    setFillAlphaInactive,
    setOutlineWidth,
    renderInactiveSegmentations,
    toggleRenderInactiveSegmentations,
    segmentationRepresentationTypes,
    data,
  } = useSegmentationTableContext('SegmentationTableConfig');

  if (!data?.length) {
    return null;
  }

  return (
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
            const type = segmentationRepresentationTypes?.[0];
            if (value === 'fill-and-outline') {
              setRenderFill({ type }, true);
              setRenderOutline({ type }, true);
              setRenderFillInactive({ type }, true);
              setRenderOutlineInactive({ type }, true);
            } else if (value === 'outline') {
              setRenderFill({ type }, false);
              setRenderOutline({ type }, true);
              setRenderFillInactive({ type }, false);
              setRenderOutlineInactive({ type }, true);
            } else {
              setRenderFill({ type }, true);
              setRenderOutline({ type }, false);
              setRenderFillInactive({ type }, true);
              setRenderOutlineInactive({ type }, false);
            }
          }}
        >
          <TabsList>
            <TabsTrigger value="fill-and-outline">
              <Icons.FillAndOutline className="text-primary" />
            </TabsTrigger>
            <TabsTrigger value="outline">
              <Icons.OutlineOnly className="text-primary" />
            </TabsTrigger>
            <TabsTrigger value="fill">
              <Icons.FillOnly className="text-primary" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-2">
        <div className="my-2 flex items-center">
          <Label className="text-muted-foreground w-14 flex-none whitespace-nowrap text-xs">
            {t('Opacity')}
          </Label>
          <Slider
            className="mx-1 flex-1"
            value={[fillAlpha]}
            onValueChange={([value]) =>
              setFillAlpha({ type: segmentationRepresentationTypes?.[0] }, value)
            }
            max={1}
            min={0}
            step={0.1}
          />
          <Input
            className="mx-1 w-10 flex-none"
            value={fillAlpha}
            onChange={e =>
              setFillAlpha({ type: segmentationRepresentationTypes?.[0] }, Number(e.target.value))
            }
          />
        </div>

        <div className="my-2 flex items-center">
          <Label className="text-muted-foreground w-14 flex-none whitespace-nowrap text-xs">
            {t('Border')}
          </Label>
          <Slider
            value={[outlineWidth]}
            onValueChange={([value]) =>
              setOutlineWidth({ type: segmentationRepresentationTypes?.[0] }, value)
            }
            max={10}
            min={0}
            step={0.1}
            className="mx-1 flex-1"
          />
          <Input
            value={outlineWidth}
            onChange={e =>
              setOutlineWidth(
                { type: segmentationRepresentationTypes?.[0] },
                Number(e.target.value)
              )
            }
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
            {t('Opacity')}
          </Label>
          <Slider
            className="mx-1 flex-1"
            value={[fillAlphaInactive]}
            onValueChange={([value]) => setFillAlphaInactive({}, value)}
            max={1}
            min={0}
            step={0.1}
          />
          <Input
            className="mx-1 w-10 flex-none"
            value={fillAlphaInactive}
            onChange={e => setFillAlphaInactive({}, Number(e.target.value))}
          />
        </div>
      )}
      {children}
    </div>
  );
};
