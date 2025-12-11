import React, { useState } from 'react';
import { Button, Input, Label, Separator } from '@ohif/ui-next';
import { useRunCommand } from '@ohif/core';
import { useTranslation } from 'react-i18next';

function SimplifyContourOptions() {
  const [areaThreshold, setAreaThreshold] = useState(10);

  const runCommand = useRunCommand();
  const { t } = useTranslation('SegmentationPanel');

  return (
    <div className="flex w-auto w-[252px] flex-col gap-[8px] text-base font-normal leading-none">
      <div className="flex w-auto flex-col gap-[10px] text-base font-normal leading-none">
        <div>{t('Fill contour holes')}</div>
        <Button
          className="border-primary/60 border"
          variant="ghost"
          onClick={() => {
            runCommand('removeContourHoles');
          }}
        >
          {t('Fill Holes')}
        </Button>
        <Separator className="bg-input mt-[20px] h-[1px]" />
      </div>
      <div className="flex w-auto flex-col gap-[10px] text-base font-normal leading-none">
        <div>{t('Remove Small Contours')}</div>
        <div className="flex items-center gap-2 self-end">
          <Label
            htmlFor="simplify-contour-options"
            className="text-muted-foreground"
          >
            {t('Area Threshold')}
          </Label>
          <Input
            id="simplify-contour-options"
            className="w-20"
            type="number"
            value={areaThreshold}
            onChange={e => setAreaThreshold(Number(e.target.value))}
          />
        </div>
        <Button
          className="border-primary/60 border"
          variant="ghost"
          onClick={() => {
            runCommand('removeSmallContours', {
              areaThreshold,
            });
          }}
        >
          {t('Remove Small Contours')}
        </Button>
        <Separator className="bg-input mt-[20px] h-[1px]" />
      </div>
      <div className="flex w-auto flex-col gap-[10px] text-base font-normal leading-none">
        <div>{t('Create New Segment from Holes')}</div>
        <Button
          className="border-primary/60 border"
          variant="ghost"
          onClick={() => {
            runCommand('convertContourHoles');
          }}
        >
          {t('Create New Segment')}
        </Button>
      </div>
    </div>
  );
}

export default SimplifyContourOptions;
