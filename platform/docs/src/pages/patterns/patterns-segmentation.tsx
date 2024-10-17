import React, { useState } from 'react';

import { DataRow } from '../../../../ui-next/src/components/DataRow';
import { Button } from '../../../../ui-next/src/components/Button';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '../../../../ui-next/src/components/Select';
import { Icons } from '../../../../ui-next/src/components/Icons';
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
} from '../../../../ui-next/src/components/DropdownMenu';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../../../../ui-next/src/components/Accordion';
import { Slider } from '../../../../ui-next/src/components/Slider';
import { Switch } from '../../../../ui-next/src/components/Switch';
import { Label } from '../../../../ui-next/src/components/Label';
import { Input } from '../../../../ui-next/src/components/Input';
import { Tabs, TabsList, TabsTrigger } from '../../../../ui-next/src/components/Tabs';
import { actionOptionsMap, dataList } from '../../../../ui-next/assets/data';

interface DataItem {
  id: number;
  title: string;
  description: string;
  optionalField?: string;
  colorHex?: string;
  details?: string;
  series?: string;
}

interface ListGroup {
  type: string;
  items: DataItem[];
}

export default function SegmentationPanel() {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('Fill & Outline');
  const handleAction = (id: string, action: string) => {
    console.log(`Action "${action}" triggered for item with id: ${id}`);
    // Implement actual action logic here
  };

  // Handle row selection
  const handleRowSelect = (id: string) => {
    setSelectedRowId(prevSelectedId => (prevSelectedId === id ? null : id));
  };

  const organSegmentationGroup = dataList.find(
    (listGroup: ListGroup) => listGroup.type === 'Organ Segmentation'
  );

  if (!organSegmentationGroup) {
    return <div className="text-red-500">Organ Segmentation data not found.</div>;
  }

  return (
    <div className="my-4 flex h-full w-full max-w-6xl justify-end bg-black py-6">
      <div className="w-64 space-y-0">
        <Accordion
          type="multiple"
          defaultValue={['segmentation-tools', 'segmentation-list']}
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

          {/* Segmentation List */}
          <AccordionItem value="segmentation-list">
            <AccordionTrigger className="bg-popover hover:bg-accent text-muted-foreground my-0.5 flex h-7 w-full items-center justify-between rounded py-2 pr-1 pl-2 font-normal">
              <span>Segmentation List</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="mb-0">
                {/* Header Controls */}
                <div className="bg-muted flex h-10 w-full items-center space-x-1 rounded-t px-1.5">
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
                      <DropdownMenuItem>
                        <Icons.Add className="text-foreground" />
                        <span className="pl-2">Create New Segmentation</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Manage Current Segmentation</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Icons.Series className="text-foreground" />
                        <span className="pl-2">Remove from Viewport</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Icons.Rename className="text-foreground" />
                        <span className="pl-2">Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Icons.Export className="text-foreground" />
                          <span className="pl-2">Export & Download</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem>Export DICOM SEG</DropdownMenuItem>
                            <DropdownMenuItem>Download DICOM SEG</DropdownMenuItem>
                            <DropdownMenuItem>Download DICOM RTSTRUCT</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Icons.Delete className="text-red-600" />
                        <span className="pl-2 text-red-600">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Select>
                    <SelectTrigger className="w-full overflow-hidden">
                      <SelectValue placeholder="Segmentation 1" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seg1">Segmentation 1</SelectItem>
                      <SelectItem value="seg2">Segmentation 2</SelectItem>
                      <SelectItem value="seg3">Segmentation Long Name 123</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <Icons.Info className="h-6 w-6" />
                  </Button>
                </div>

                {/* Appearance Settings */}
                <AccordionItem value="segmentation-display">
                  <AccordionTrigger className="bg-muted hover:bg-accent mt-0.5 flex h-7 w-full items-center justify-between rounded-b pr-1 pl-2 font-normal text-white">
                    <div className="flex space-x-2">
                      <Icons.Controls className="text-primary" />
                      <span className="text-primary pr-1">Appearance Settings</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-muted mb-0.5 space-y-2 rounded-b px-1.5 pt-0.5 pb-3">
                      <div className="mx-1 mb-2.5 mt-1 flex items-center justify-between space-x-4">
                        {/* Display Label with Selected Tab */}
                        <div className="text-muted-foreground text-xs">Show: {selectedTab}</div>
                        {/* Tabs Controls */}
                        <Tabs
                          value={selectedTab}
                          onValueChange={setSelectedTab}
                        >
                          <TabsList>
                            <TabsTrigger value="Fill & Outline">
                              <Icons.DisplayFillAndOutline className="text-primary" />
                            </TabsTrigger>
                            <TabsTrigger value="Outline Only">
                              <Icons.DisplayOutlineOnly className="text-primary" />
                            </TabsTrigger>
                            <TabsTrigger value="Fill Only">
                              <Icons.DisplayFillOnly className="text-primary" />
                            </TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                      {/* Opacity Slider */}
                      <div className="my-2 flex items-center">
                        <Label className="text-muted-foreground mx-1 w-14 flex-none whitespace-nowrap text-xs">
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
                      {/* Border Slider */}
                      <div className="my-2 flex items-center">
                        <Label className="text-muted-foreground mx-1 w-14 flex-none whitespace-nowrap text-xs">
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
                      {/* Sync Changes Switch */}
                      <div className="my-2 flex items-center pl-1 pb-1">
                        <Switch defaultChecked />
                        <Label className="text-muted-foreground mx-2 w-14 flex-none whitespace-nowrap text-xs">
                          Sync changes in all viewports
                        </Label>
                      </div>
                      <div className="border-input w-full border"></div>
                      {/* Display Inactive Segmentations Switch */}
                      <div className="my-2 flex items-center pl-1">
                        <Switch defaultChecked />
                        <Label className="text-muted-foreground mx-2 w-14 flex-none whitespace-nowrap text-xs">
                          Display inactive segmentations
                        </Label>
                      </div>
                      {/* Additional Opacity Slider */}
                      <div className="my-2 flex items-center">
                        <Label className="text-muted-foreground mx-1 w-14 flex-none whitespace-nowrap text-xs">
                          Opacity
                        </Label>
                        <Slider
                          className="mx-1 flex-1"
                          defaultValue={[65]}
                          max={100}
                          step={1}
                        />
                        <Input
                          className="mx-1 w-10 flex-none"
                          placeholder="65"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                {/* Action Buttons */}
                <div className="my-px flex h-9 w-full items-center justify-between rounded pl-0.5 pr-7">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="pr pl-0.5"
                  >
                    <Icons.Add />
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

              {/* Data Rows */}
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
                      series={item.series}
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
