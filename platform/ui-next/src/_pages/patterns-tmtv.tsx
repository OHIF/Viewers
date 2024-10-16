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

import { ChevronDownIcon } from '@radix-ui/react-icons';

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

function Patterns() {
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

  // Find the "Organ Segmentation" group
  const tmv2Group = dataList.find((listGroup: ListGroup) => listGroup.type === 'TMTV2');

  // Find the "TMTV1" group
  const tmvGroup = dataList.find((listGroup: ListGroup) => listGroup.type === 'TMTV1');

  // Check if both groups exist
  if (!tmv2Group) {
    return <div className="text-red-500">Organ Segmentation data not found.</div>;
  }

  if (!tmvGroup) {
    return <div className="text-red-500">TMTV1 data not found.</div>;
  }

  return (
    <div className="my-4 flex max-w-6xl justify-end py-6">
      <div className="w-64 space-y-0">
        <Accordion
          type="multiple"
          defaultValue={['segmentation-tools', 'segmentation-list', 'tmv1-group']}
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

          {/* Segmentation List */}
          <AccordionItem value="segmentation-list">
            <AccordionTrigger className="bg-popover hover:bg-accent text-muted-foreground my-0.5 flex h-7 w-full items-center justify-between rounded py-2 pr-1 pl-2 font-normal">
              <span>Segmentation List</span>
            </AccordionTrigger>
            <AccordionContent>
              {/* Appearance Settings */}
              <AccordionItem value="segmentation-display">
                <AccordionTrigger className="bg-muted hover:bg-accent mt-0.5 flex h-7 w-full items-center justify-between rounded-b pr-1 pl-2 font-normal text-white">
                  <div className="flex space-x-2">
                    <Icons.Controls className="text-primary" />
                    <span className="text-primary pr-1">Appearance Settings</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="bg-muted mb-0.5 space-y-2 rounded-b px-px pt-0.5 pb-3">
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
                    <div className="my-2 flex items-center ">
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
                    <div className="my-2 flex items-center ">
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
              <div className="mb-0">
                <div className="border-input flex h-9 w-full items-center justify-between rounded px-2">
                  {/* Left Side: Add Segmentation Button */}
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="pr pl-0.5"
                    >
                      <Icons.Add className="h-5 w-5" />
                      <span>Add Segmentation</span>
                    </Button>
                  </div>

                  {/* Right Side: Export Button */}
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="pl-1.5"
                    >
                      <Icons.Export className="h-5 w-5" />
                      <span className="pl-1">Export</span>
                    </Button>
                  </div>
                </div>

                {/* Header Controls */}
                <div className="bg-background text-foreground border-input flex h-8 w-full items-center justify-between border-t-2 ">
                  {/* Left Group: DropdownMenu and Segmentation Label */}
                  <div className="flex items-center space-x-1">
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
                          <span className="pl-2">Add Segment</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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

                    <div className="pl-1.5">Segmentation 1</div>
                  </div>

                  {/* Right Element: Info Button */}
                  <div className="flex items-center space-x-1">
                    <Button
                      size="icon"
                      variant="ghost"
                    >
                      <Icons.Hide className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                    >
                      <Icons.Info className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                {/* Data Rows for TMTV part 1 */}
                <div className="space-y-px">
                  {tmvGroup.items.map((item, index) => {
                    const compositeId = `${tmvGroup.type}-${item.id}-panel`; // Ensure unique composite ID
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
                        actionOptions={actionOptionsMap[tmvGroup.type] || ['Action']}
                        onAction={(action: string) => handleAction(compositeId, action)}
                        isSelected={selectedRowId === compositeId}
                        onSelect={() => handleRowSelect(compositeId)}
                      />
                    );
                  })}
                </div>
              </div>
              {/* Header Controls for TMTV1 */}
              <div className="bg-background text-foreground border-input flex h-8 w-full items-center justify-between border-t-2 ">
                {/* Left Group: DropdownMenu and TMTV1 Label */}
                <div className="flex items-center space-x-1">
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
                        <span className="pl-2">Add Segment</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
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

                  <div className="pl-1.5">Segmentation 2</div>
                </div>

                {/* Right Element: Info Button */}
                <div className="flex items-center space-x-1">
                  <Button
                    size="icon"
                    variant="ghost"
                  >
                    <Icons.Hide className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <Icons.Info className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Data Rows for TMTV part 2 */}
              <div className="space-y-px">
                {tmv2Group.items.map((item, index) => {
                  const compositeId = `${tmv2Group.type}-${item.id}-panel`; // Ensure unique composite ID
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
                      actionOptions={actionOptionsMap[tmv2Group.type] || ['Action']}
                      onAction={(action: string) => handleAction(compositeId, action)}
                      isSelected={selectedRowId === compositeId}
                      onSelect={() => handleRowSelect(compositeId)}
                    />
                  );
                })}
              </div>
              <div className="bg-popover text-foreground flex h-8 items-center justify-between pl-9 pr-3">
                <span>TMTV</span>
                <span>21.555 mL</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* TMTV1 Group */}
          <AccordionItem>
            <AccordionContent></AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Patterns />);
