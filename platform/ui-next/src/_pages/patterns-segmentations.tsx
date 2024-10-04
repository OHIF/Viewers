// src/_pages/patterns.tsx

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';

import { Button } from '../components/Button';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from '../components/Select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '../components/DropdownMenu';
import { Icons } from '../components/Icons/Icons';
import DataRow from '../_prototypes/DataRow/DataRow';
import dataList from '../_prototypes/DataRow/dataList.json';
import actionOptionsMap from '../_prototypes/DataRow/actionOptionsMap';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/Accordion/Accordion';
import { Slider } from '../components/Slider';
import { Switch } from '../components/Switch';
import { Label } from '../components/Label';
import { Input } from '../components/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/Tabs';

import { ChevronDownIcon } from '@radix-ui/react-icons'; // Ensure ChevronDownIcon is imported

interface DataItem {
  id: number;
  title: string;
  description: string;
  optionalField?: string;
  colorHex?: string;
  details?: string;
}

interface ListGroup {
  type: string;
  items: DataItem[];
}

function Patterns() {
  // State to track the selected row ID
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Handle actions from DataRow
  const handleAction = (id: string, action: string) => {
    console.log(`Action "${action}" triggered for item with id: ${id}`);
    // Implement actual action logic here
  };

  // Handle row selection
  const handleRowSelect = (id: string) => {
    setSelectedRowId(prevSelectedId => (prevSelectedId === id ? null : id));
  };

  // Find the "Organ Segmentation" list group
  const organSegmentationGroup = dataList.find(
    (listGroup: ListGroup) => listGroup.type === 'Organ Segmentation'
  );

  if (!organSegmentationGroup) {
    return <div className="text-red-500">Organ Segmentation data not found.</div>;
  }

  return (
    <div className="my-4 flex max-w-6xl justify-end py-6">
      {/* Simulated Panel List for "Segmentation" */}
      <div className="w-64 space-y-0">
        <Accordion
          type="multiple"
          defaultValue={['segmentation-tools', 'segmentation-list']}
          collapsible
        >
          {/* Segmentation Tools */}
          <AccordionItem value="segmentation-tools">
            <AccordionTrigger className="bg-popover hover:bg-accent text-muted-foreground my-0.5 flex h-7 w-full items-center justify-between rounded py-2 pr-1 pl-2 font-normal">
              <span>Segmentation Tools</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-muted mb-0.5 h-32 rounded-b pb-3"></div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="segmentation-list">
            <AccordionTrigger className="bg-popover hover:bg-accent text-muted-foreground my-0.5 flex h-7 w-full items-center justify-between rounded py-2 pr-1 pl-2 font-normal">
              <span>Segmentation List</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="mb-0">
                <div className="bg-muted flex h-10 w-full items-center space-x-1 rounded-t px-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                      >
                        <Icons.Actions className="h-6 w-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>Create New Segmentation</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Current Segmentation</DropdownMenuLabel>
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                      <DropdownMenuItem>Delete</DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem>Export DICOM SEG</DropdownMenuItem>
                            <DropdownMenuItem>Download DICOM SEG</DropdownMenuItem>
                            <DropdownMenuItem>Download DICOM RTSTRUCT</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Segmentation 1" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seg1">Segmentation 1</SelectItem>
                      <SelectItem value="seg2">Segmentation 2</SelectItem>
                      <SelectItem value="seg3">Segmentation 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <Icons.Info className="h-6 w-6" />
                  </Button>
                </div>
                <AccordionItem value="segmentation-display">
                  <AccordionTrigger className="bg-muted hover:bg-accent mt-0.5 flex h-7 w-full items-center justify-between rounded-b pr-1 pl-2 font-normal text-white">
                    <span className="text-primary pl-8 pr-1">Appearance Settings</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-muted mb-0.5 space-y-3 px-1.5 pt-1 pb-6">
                      <div className="my-2 flex items-center">
                        <Label className="text-muted-foreground mx-1 w-14 flex-none whitespace-nowrap">
                          Opacity
                        </Label>
                        <Slider
                          className="mx-1 flex-1"
                          defaultValue={[85]}
                          max={100}
                          step={1}
                        />
                        <Input
                          className="mx-1 w-10 flex-none"
                          placeholder="85"
                        />
                      </div>
                      <div className="my-2 flex items-center">
                        <Label className="text-muted-foreground mx-1 w-14 flex-none whitespace-nowrap">
                          Border
                        </Label>
                        <Slider
                          className="mx-1 flex-1"
                          defaultValue={[10]}
                          max={100}
                          step={1}
                        />
                        <Input
                          className="mx-1 w-10 flex-none"
                          placeholder="2"
                        />
                      </div>
                      <div className="my-2 flex items-center pl-1">
                        <Switch defaultChecked />
                        <Label className="text-muted-foreground mx-2 w-14 flex-none whitespace-nowrap">
                          Sync changes in all viewports
                        </Label>
                      </div>
                      <div className="my-2 flex items-center pl-1">
                        <Switch />
                        <Label className="text-muted-foreground mx-2 w-14 flex-none whitespace-nowrap">
                          Display inactive segments
                        </Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <div className="mt-2 flex h-9 w-full items-center justify-between rounded pl-6 pr-2">
                  <Button variant="ghost">
                    <Icons.Add className="h-3 w-3" />
                    Add Segment
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                  >
                    <Icons.Hide className="h-6 w-6" />
                  </Button>
                </div>
              </div>
              <div className="space-y-px">
                {organSegmentationGroup.items.map((item, index) => {
                  const compositeId = `${organSegmentationGroup.type}-${item.id}-panel`; // Ensure unique composite ID
                  return (
                    <DataRow
                      key={`panel-${compositeId}`} // Prefix to ensure uniqueness
                      number={index + 1}
                      title={item.title}
                      description={item.description}
                      optionalField={item.optionalField}
                      colorHex={item.colorHex}
                      details={item.details}
                      actionOptions={actionOptionsMap[organSegmentationGroup.type] || ['Action']}
                      onAction={(action: string) => handleAction(compositeId, action)}
                      isSelected={selectedRowId === compositeId}
                      onSelect={() => handleRowSelect(compositeId)}
                    />
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Patterns />);
