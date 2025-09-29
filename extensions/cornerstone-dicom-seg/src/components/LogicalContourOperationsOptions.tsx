import React, { useCallback, useEffect, useState } from 'react';
import { useRunCommand, useSystem } from '@ohif/core';
import { useActiveViewportSegmentationRepresentations } from '@ohif/extension-cornerstone';
import {
  Button,
  cn,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@ohif/ui-next';
import { Icons } from '@ohif/ui-next';
import { contourSegmentation } from '@cornerstonejs/tools/utilities';
import { Segment } from '@cornerstonejs/tools/types';

const { LogicalOperation } = contourSegmentation;
const options = [
  {
    value: 'merge',
    logicalOperation: LogicalOperation.Union,
    label: 'Merge',
    icon: 'actions-combine-merge',
    helperIcon: 'helper-combine-merge',
  },
  {
    value: 'intersect',
    logicalOperation: LogicalOperation.Intersect,
    label: 'Intersect',
    icon: 'actions-combine-intersect',
    helperIcon: 'helper-combine-intersect',
  },
  {
    value: 'subtract',
    logicalOperation: LogicalOperation.Subtract,
    label: 'Subtract',
    icon: 'actions-combine-subtract',
    helperIcon: 'helper-combine-subtract',
  },
];

// Shared component for segment selection
function SegmentSelector({
  label,
  value,
  onValueChange,
  segments,
  placeholder = 'Select a segment',
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  segments: Segment[];
  placeholder?: string;
}) {
  return (
    <div className="flex justify-between gap-6">
      <div>{label}</div>
      <Select
        key={`select-segment-${label}`}
        onValueChange={onValueChange}
        value={value}
      >
        <SelectTrigger className="overflow-hidden">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {segments.map(segment => (
            <SelectItem
              key={segment.segmentIndex}
              value={segment.segmentIndex.toString()}
            >
              {segment.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LogicalContourOperationOptions() {
  const { servicesManager } = useSystem();
  const { segmentationService } = servicesManager.services;
  const { segmentationsWithRepresentations } = useActiveViewportSegmentationRepresentations();

  const activeRepresentation = segmentationsWithRepresentations?.find(
    ({ representation }) => representation?.active
  );

  const segments = activeRepresentation
    ? Object.values(activeRepresentation.segmentation.segments)
    : [];

  // Calculate the next available segment index
  const nextSegmentIndex = activeRepresentation
    ? segmentationService.getNextAvailableSegmentIndex(
        activeRepresentation.segmentation.segmentationId
      )
    : 1;

  const activeSegment = segments.find(segment => segment.active);

  const activeSegmentIndex = activeSegment?.segmentIndex || 0;

  const [operation, setOperation] = useState(options[0]);
  const [segmentA, setSegmentA] = useState<string>(activeSegmentIndex?.toString() || '');
  const [segmentB, setSegmentB] = useState<string>('');
  const [createNewSegment, setCreateNewSegment] = useState<boolean>(false);
  const [newSegmentName, setNewSegmentName] = useState<string>('');

  useEffect(() => {
    setSegmentA(activeSegmentIndex?.toString() || null);
  }, [activeSegmentIndex]);

  useEffect(() => {
    setNewSegmentName(`Segment ${nextSegmentIndex}`);
  }, [nextSegmentIndex]);

  const runCommand = useRunCommand();

  const applyLogicalContourOperation = useCallback(() => {
    let resultSegmentIndex = segmentA;
    if (createNewSegment) {
      resultSegmentIndex = nextSegmentIndex.toString();
      runCommand('addSegment', {
        segmentationId: activeRepresentation.segmentation.segmentationId,
        config: {
          label: newSegmentName,
          segmentIndex: nextSegmentIndex,
        },
      });
    }
    runCommand('applyLogicalContourOperation', {
      segmentAInfo: {
        segmentationId: activeRepresentation.segmentation.segmentationId,
        segmentIndex: parseInt(segmentA),
      },
      segmentBInfo: {
        segmentationId: activeRepresentation.segmentation.segmentationId,
        segmentIndex: parseInt(segmentB),
      },
      resultSegmentInfo: {
        segmentationId: activeRepresentation.segmentation.segmentationId,
        segmentIndex: parseInt(resultSegmentIndex),
      },
      logicalOperation: operation.logicalOperation,
    });
  }, [
    activeRepresentation?.segmentation?.segmentationId,
    createNewSegment,
    newSegmentName,
    nextSegmentIndex,
    operation.logicalOperation,
    runCommand,
    segmentA,
    segmentB,
  ]);

  return (
    <div className="flex w-[245px] flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex w-auto flex-col items-center gap-2 text-base font-normal leading-none">
          <Tabs value={operation.value}>
            <TabsList className="inline-flex space-x-1">
              {options.map(option => {
                const { value, icon } = option;
                return (
                  <TabsTrigger
                    value={value}
                    key={`logical-contour-operation-${value}`}
                    onClick={() => setOperation(option)}
                  >
                    <Icons.ByName name={icon}></Icons.ByName>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <div>{operation.label}</div>
        </div>
        <div className="bg-primary-dark flex h-[62px] w-[88px] items-center justify-center rounded-lg">
          <Icons.ByName name={operation.helperIcon}></Icons.ByName>
        </div>
      </div>
      <SegmentSelector
        label="A"
        value={segmentA}
        onValueChange={setSegmentA}
        segments={segments}
      />
      <SegmentSelector
        label="B"
        value={segmentB}
        onValueChange={setSegmentB}
        segments={segments}
      />
      <div className="flex justify-end pl-[34px]">
        <Button
          className="border-primary/60 grow border"
          variant="ghost"
          onClick={() => {
            applyLogicalContourOperation();
          }}
        >
          {operation.label}
        </Button>
      </div>
      <Separator className="bg-input mt-2 h-[1px]" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-start gap-2">
          <Switch
            id="logical-contour-operations-create-new-segment-switch"
            onCheckedChange={setCreateNewSegment}
          ></Switch>
          <Label htmlFor="logical-contour-operations-create-new-segment-switch">
            Create a new segment
          </Label>
        </div>
        <div className="pl-9">
          <Input
            className={cn(createNewSegment ? 'visible' : 'hidden')}
            disabled={!createNewSegment}
            id="logical-contour-operations-create-new-segment-input"
            type="text"
            placeholder="New segment name"
            value={newSegmentName}
            onChange={e => setNewSegmentName(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default LogicalContourOperationOptions;
