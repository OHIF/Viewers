import React, { useState } from 'react';
import {
  Icons,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuSub,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../../components';
import { useTranslation } from 'react-i18next';
import AddSegmentRow from './AddSegmentRow';
import SegmentationGroupSegment from './SegmentationGroupSegment';
import classNames from 'classnames';

interface SegmentationItemProps {
  segmentation: {
    id: string;
    label: string;
    description: string;
    segments: any[];
    activeSegmentIndex: number;
  };
  disableEditing?: boolean;
  onSegmentationEdit: (segmentationId: string) => void;
  onSegmentationDownload: (segmentationId: string) => void;
  onSegmentationDownloadRTSS: (segmentationId: string) => void;
  storeSegmentation: (segmentationId: string) => void;
  onSegmentationDelete: (segmentationId: string) => void;
  showAddSegment?: boolean;
  onToggleSegmentationVisibility: (segmentationId: string) => void;
  onSegmentAdd: (segmentationId: string) => void;
  onSegmentClick: (segmentationId: string, segmentIndex: number) => void;
  onSegmentDelete: (segmentationId: string, segmentIndex: number) => void;
  onSegmentEdit: (segmentationId: string, segmentIndex: number) => void;
  showDeleteSegment?: boolean;
  onSegmentColorClick: (segmentationId: string, segmentIndex: number) => void;
  onToggleSegmentVisibility: (segmentationId: string, segmentIndex: number) => void;
  onToggleSegmentLock: (segmentationId: string, segmentIndex: number) => void;
  activeSegmentationId: string;
}

const SegmentationItem: React.FC<SegmentationItemProps> = ({
  segmentation,
  disableEditing = false,
  onSegmentationEdit,
  onSegmentationDownload,
  onSegmentationDownloadRTSS,
  storeSegmentation,
  onSegmentationDelete,
  showAddSegment = true,
  onToggleSegmentationVisibility,
  onSegmentAdd,
  onSegmentClick,
  onSegmentDelete,
  onSegmentEdit,
  showDeleteSegment = true,
  onSegmentColorClick,
  onToggleSegmentVisibility,
  onToggleSegmentLock,
  activeSegmentationId,
}) => {
  const { t } = useTranslation('SegmentationTable');
  const [areChildrenVisible, setChildrenVisible] = useState(true);

  const handleHeaderClick = () => {
    setChildrenVisible(!areChildrenVisible);
  };

  const dropdownItems = [
    {
      title: t('Rename'),
      icon: <Icons.Rename className="text-foreground" />,
      onClick: () => onSegmentationEdit(segmentation.id),
    },
    {
      title: t('Delete'),
      icon: <Icons.Delete className="text-foreground" />,
      onClick: () => onSegmentationDelete(segmentation.id),
    },
    {
      title: t('Export & Download'),
      icon: <Icons.Export className="text-foreground" />,
      subItems: [
        {
          title: t('Export DICOM SEG'),
          onClick: () => storeSegmentation(segmentation.id),
        },
        {
          title: t('Download DICOM SEG'),
          onClick: () => onSegmentationDownload(segmentation.id),
        },
        {
          title: t('Download DICOM RTSTRUCT'),
          onClick: () => onSegmentationDownloadRTSS(segmentation.id),
        },
      ],
    },
  ];

  return (
    <>
      <div className="bg-secondary-dark group relative flex items-center justify-start gap-1">
        <div
          onClick={e => {
            e.stopPropagation();
          }}
          className="flex"
        >
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
                item.subItems ? (
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
          <div
            className="h-[28px] bg-black"
            style={{ width: '3px' }}
          ></div>
        </div>
        <div
          className="flex h-full w-full cursor-pointer items-center justify-between pr-[8px]"
          onClick={handleHeaderClick}
        >
          <div className="font-inter text-aqua-pale text-[13px]">{segmentation.label}</div>
          <div className="flex h-[28px] items-center justify-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <Icons.InfoSeries className="text-primary-active" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col">
                  <div className="text-[13px] text-white">Series:</div>
                  <div className="text-aqua-pale text-[13px]">{segmentation.description}</div>
                </div>
              </TooltipContent>
            </Tooltip>
            <div className={areChildrenVisible ? '' : 'mr-[4px]'}>
              {areChildrenVisible ? <Icons.ChevronClosed /> : <Icons.ChevronOpen />}
            </div>
          </div>
        </div>
      </div>
      {areChildrenVisible && (
        <>
          {!disableEditing && showAddSegment && (
            <AddSegmentRow
              onClick={() => onSegmentAdd(segmentation.id)}
              onToggleSegmentationVisibility={onToggleSegmentationVisibility}
              segmentation={segmentation}
            />
          )}
          <div
            className={classNames('ohif-scrollbar flex min-h-0 flex-col overflow-y-hidden', {
              'mt-1': disableEditing || !showAddSegment,
            })}
          >
            {segmentation.segments.map(segment => {
              if (!segment) {
                return null;
              }

              const { segmentIndex, color, label, isVisible, isLocked, displayText } = segment;
              return (
                <SegmentationGroupSegment
                  key={segmentIndex}
                  segmentationId={segmentation.id}
                  segmentIndex={segmentIndex}
                  label={label}
                  color={color}
                  isActive={
                    segmentation.activeSegmentIndex === segmentIndex &&
                    segmentation.id === activeSegmentationId
                  }
                  disableEditing={disableEditing}
                  isLocked={isLocked}
                  isVisible={isVisible}
                  onClick={onSegmentClick}
                  onEdit={onSegmentEdit}
                  onDelete={onSegmentDelete}
                  onColor={onSegmentColorClick}
                  onToggleVisibility={onToggleSegmentVisibility}
                  onToggleLocked={onToggleSegmentLock}
                  displayText={displayText}
                />
              );
            })}
          </div>
        </>
      )}
    </>
  );
};

export default SegmentationItem;
