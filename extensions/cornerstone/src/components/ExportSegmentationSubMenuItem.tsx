import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuItem,
  Icons,
} from '@ohif/ui-next';

import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';

interface ExportSegmentationSubMenuItemProps {
  segmentationId: string;
  segmentationRepresentationType: string;
  allowExport: boolean;
  actions: {
    storeSegmentation: (segmentationId: string, modality?: string) => Promise<unknown>;
    downloadCSVSegmentationReport: (segmentationId: string) => void;
  };
}

export const ExportSegmentationSubMenuItem: React.FC<ExportSegmentationSubMenuItemProps> = ({
  segmentationId,
  segmentationRepresentationType,
  allowExport,
  actions,
}) => {
  const { t } = useTranslation('SegmentationPanel');

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="pl-1">
        <Icons.Export className="text-foreground" />
        <span className="pl-2">{t('Export')}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {segmentationRepresentationType === SegmentationRepresentations.Labelmap && (
            <DropdownMenuItem
              onClick={e => {
                e.preventDefault();
                actions.downloadCSVSegmentationReport(segmentationId);
              }}
              disabled={!allowExport}
            >
              {t('CSV Report')}
            </DropdownMenuItem>
          )}
          {segmentationRepresentationType === SegmentationRepresentations.Labelmap && (
            <DropdownMenuItem
              onClick={e => {
                e.preventDefault();
                actions.storeSegmentation(segmentationId, 'SEG');
              }}
              disabled={!allowExport}
            >
              {t('DICOM SEG')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={e => {
              e.preventDefault();
              actions.storeSegmentation(segmentationId, 'RTSTRUCT');
            }}
            disabled={!allowExport}
          >
            {t('DICOM RTSS')}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};
