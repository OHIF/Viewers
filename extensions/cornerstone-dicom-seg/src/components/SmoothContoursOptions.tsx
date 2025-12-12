import React from 'react';
import { Button, Separator } from '@ohif/ui-next';
import { useRunCommand } from '@ohif/core';
import { useTranslation } from 'react-i18next';

function SmoothContoursOptions() {
  const runCommand = useRunCommand();
  const { t } = useTranslation('SegmentationPanel');

  return (
    <div className="flex w-auto w-[245px] flex-col gap-[8px] text-base font-normal leading-none">
      <div className="flex w-auto flex-col gap-[10px] text-base font-normal leading-none">
        <div>{t('Smooth all edges')}</div>
        <Button
          className="border-primary/60 border"
          variant="ghost"
          onClick={() => {
            runCommand('smoothContours');
          }}
        >
          {t('Smooth Edges')}
        </Button>
        <Separator className="bg-input mt-[20px] h-[1px]" />
      </div>
      <div className="flex w-auto flex-col gap-[10px] text-base font-normal leading-none">
        <div>{t('Remove extra points')}</div>
        <Button
          className="border-primary/60 border"
          variant="ghost"
          onClick={() => {
            runCommand('decimateContours');
          }}
        >
          {t('Remove Points')}
        </Button>
      </div>
    </div>
  );
}

export default SmoothContoursOptions;
