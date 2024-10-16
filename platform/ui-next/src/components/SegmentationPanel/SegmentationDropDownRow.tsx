import React from 'react';
import {
  Icons,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '../../components';
import { useTranslation } from 'react-i18next';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@ohif/ui-next';

type Segmentation = {
  id: string;
  label: string;
  isActive: boolean;
  isVisible: boolean;
};

interface SegmentationDropDownRowProps {
  segmentations: Segmentation[];
  onActiveSegmentationChange: (segmentationId: string) => void;
  disableEditing?: boolean;
  onToggleSegmentationVisibility: (segmentationId: string) => void;
  onSegmentationEdit: (segmentationId: string) => void;
  onSegmentationDownload: (segmentationId: string) => void;
  onSegmentationDownloadRTSS: (segmentationId: string) => void;
  storeSegmentation: (segmentationId: string) => void;
  onSegmentationDelete: (segmentationId: string) => void;
  onSegmentationAdd: () => void;
}

const SegmentationDropDownRow: React.FC<SegmentationDropDownRowProps> = ({
  segmentations,
  onActiveSegmentationChange,
  onSegmentationEdit,
  onSegmentationDownload,
  onSegmentationDownloadRTSS,
  storeSegmentation,
  onSegmentationDelete,
  onSegmentationAdd,
}) => {
  const { t } = useTranslation('SegmentationTable');

  const activeSegmentation = segmentations.find(seg => seg.isActive);
  if (!activeSegmentation) {
    return null;
  }

  const dropdownItems = [
    {
      title: t('Create New Segmentation'),
      icon: <Icons.Add className="text-foreground" />,
      onClick: onSegmentationAdd,
    },
    { isDivider: true },
    {
      title: t('Rename'),
      icon: <Icons.Rename className="text-foreground" />,
      onClick: () => onSegmentationEdit(activeSegmentation.id),
    },
    {
      title: t('Delete'),
      icon: <Icons.Delete className="text-foreground" />,
      onClick: () => onSegmentationDelete(activeSegmentation.id),
    },
    {
      title: t('Export & Download'),
      icon: <Icons.Export className="text-foreground" />,
      subItems: [
        {
          title: t('Export DICOM SEG'),
          onClick: () => storeSegmentation(activeSegmentation.id),
        },
        {
          title: t('Download DICOM SEG'),
          onClick: () => onSegmentationDownload(activeSegmentation.id),
        },
        {
          title: t('Download DICOM RTSTRUCT'),
          onClick: () => onSegmentationDownloadRTSS(activeSegmentation.id),
        },
      ],
    },
  ];

  return (
    <div className="bg-primary-dark flex h-10 w-full items-center space-x-1 rounded-t px-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
          >
            <Icons.More className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {dropdownItems.map((item, index) =>
            item.isDivider ? (
              <DropdownMenuSeparator key={index} />
            ) : item.subItems ? (
              <DropdownMenuSub key={index}>
                <DropdownMenuSubTrigger>
                  {item.icon}
                  <span className="pl-2">{item.title}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {item.subItems.map((subItem, subIndex) => (
                      <DropdownMenuItem
                        key={subIndex}
                        onClick={subItem.onClick}
                      >
                        {subItem.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            ) : (
              <DropdownMenuItem
                key={index}
                onClick={item.onClick}
              >
                {item.icon}
                <span className="pl-2">{item.title}</span>
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Select
        onValueChange={value => onActiveSegmentationChange(value)}
        value={activeSegmentation.id}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t('Select a segmentation')} />
        </SelectTrigger>
        <SelectContent>
          {segmentations.map(seg => (
            <SelectItem
              key={seg.id}
              value={seg.id}
            >
              {seg.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
            >
              <Icons.Info className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            align="end"
          >
            {activeSegmentation.info}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SegmentationDropDownRow;
