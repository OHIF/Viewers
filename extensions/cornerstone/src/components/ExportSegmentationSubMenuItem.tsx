import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Icons,
} from '@ohif/ui-next';

import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';

interface ExportSegmentationSubMenuItemProps {
  segmentationId: string;
  segmentationRepresentationType: string;
  allowExport: boolean;
  actions: {
    storeSegmentation: (segmentationId: string) => Promise<void>;
    onSegmentationDownloadRTSS: (segmentationId: string) => void;
    onSegmentationDownload: (segmentationId: string) => void;
    downloadCSVSegmentationReport: (segmentationId: string) => void;
  };
}

export const ExportSegmentationSubMenuItem: React.FC<ExportSegmentationSubMenuItemProps> = ({
  segmentationId,
  segmentationRepresentationType,
  allowExport,
  actions,
}) => {
  const { t } = useTranslation('SegmentationTable');

  return (
    <>
      {segmentationRepresentationType === SegmentationRepresentations.Labelmap && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="pl-1">
            <Icons.Export className="text-foreground" />
            <span className="pl-2">{t('Download & Export')}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuLabel className="flex items-center pl-0">
                <Icons.Download className="h-5 w-5" />
                <span className="pl-1">{t('Download')}</span>
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={e => {
                  e.preventDefault();
                  actions.downloadCSVSegmentationReport(segmentationId);
                }}
                disabled={!allowExport}
              >
                {t('CSV Report')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.preventDefault();
                  actions.onSegmentationDownload(segmentationId);
                }}
                disabled={!allowExport}
              >
                {t('DICOM SEG')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => {
                  e.preventDefault();
                  actions.onSegmentationDownloadRTSS(segmentationId);
                }}
                disabled={!allowExport}
              >
                {t('DICOM RTSS')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center pl-0">
                <Icons.Export className="h-5 w-5" />
                <span className="pl-1 pt-1">{t('Export')}</span>
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={e => {
                  e.preventDefault();
                  actions.storeSegmentation(segmentationId);
                }}
                disabled={!allowExport}
              >
                {t('DICOM SEG')}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      )}
      {segmentationRepresentationType === SegmentationRepresentations.Contour && (
        <>
          <DropdownMenuItem
            onClick={e => {
              e.preventDefault();
              actions.onSegmentationDownloadRTSS(segmentationId);
            }}
            disabled={!allowExport}
          >
            <Icons.Export className="text-foreground" />
            <span className="pl-2">{t('Download DICOM RTSS')}</span>
          </DropdownMenuItem>
        </>
      )}
    </>
  );
};
