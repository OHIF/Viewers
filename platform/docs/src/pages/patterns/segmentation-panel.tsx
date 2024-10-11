import React, { useState } from 'react';
import {
  Button,
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
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
  Icons,
  DataRow,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Slider,
  Switch,
  Label,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@ohif/ui-next';

const actionOptionsMap: { [key: string]: string[] } = {
  Measurement: ['Rename', 'Lock', 'Delete'],
  Segmentation: ['Rename', 'Lock', 'Export', 'Delete'],
  'ROI Tools': ['Rename', 'Lock', 'Delete'],
  'Organ Segmentation': ['Rename', 'Lock', 'Export', 'Delete'],
  // Add more types and their corresponding actions as needed
};

const dataList = [
  {
    type: 'Measurement',
    items: [
      {
        id: 1,
        title: 'Measurement Label',
        description: 'Description for Measurement One.',
        optionalField: 'Optional Info 1',
        details: 'Data',
      },
      {
        id: 2,
        title: 'Measurement Label',
        description: 'Description for Measurement Two.',
        details: 'Data',
      },
    ],
  },
  {
    type: 'Segmentation',
    items: [
      {
        id: 3,
        title: 'Segmentation One',
        colorHex: '#FF5733',
        description: 'Description for Segmentation One.',
      },
      {
        id: 4,
        title: 'Segmentation Two',
        colorHex: '#FF5733',
        description: 'Description for Segmentation Two.',
      },
      {
        id: 5,
        title: 'Segmentation Three',
        colorHex: '#FF5733',
        description: 'Description for Segmentation Three.',
      },
    ],
  },
  {
    type: 'ROI Tools',
    items: [
      {
        id: 6,
        title: 'Linear',
        description: 'Description for Linear.',
        details: '49.2 mm',
        series: 'S:2 I:1',
      },
      {
        id: 7,
        title: 'Bidirectional',
        description: 'Description for Bidirectional.',
        details: 'L: 34.5 mm\nW: 23.0 mm',
        series: 'S:2 I:2',
      },
      {
        id: 8,
        title: 'Ellipse',
        description: 'Description for Ellipse.',
        details: '2641 mm²\nMax: 1087 HU',
        series: 'S:2 I:4',
      },
      {
        id: 9,
        title: 'Rectangle',
        description: 'Description for Rectangle.',
        details: '1426 mm²\nMax: 718 HU',
        series: 'S:2 I:5',
      },
      {
        id: 10,
        title: 'Circle',
        description: 'Description for Circle.',
        details: '7339 mm²\nMax: 871 HU',
        series: 'S:2 I:6',
      },
      {
        id: 11,
        title: 'Freehand ROI',
        description: 'Description for Freehand ROI.',
        details: 'Mean: 215 HU\nMax: 947 HU\nArea: 839 mm²',
        series: 'S:2 I:7',
      },
      {
        id: 12,
        title: 'Spline Tool',
        description: 'Description for Spline Tool.',
        details: 'Area: 203 mm²',
        series: 'S:2 I:8',
      },
      {
        id: 13,
        title: 'Livewire Tool',
        description: 'Description for Livewire Tool.',
        details: '',
        series: 'S:2 I:3',
      },
      {
        id: 14,
        title: 'Annotation Lorem ipsum dolor sit amet long measurement name continues here',
        description: 'Description for Annotation.',
        details: '',
        series: 'S:2 I:3',
      },
    ],
  },
  {
    type: 'Organ Segmentation',
    items: [
      {
        id: 15,
        title: 'Spleen',
        description: 'Description for Spleen.',
        colorHex: '#6B8E23',
      },
      {
        id: 16,
        title: 'Kidney',
        description: 'Description for Kidney.',
        colorHex: '#4682B4',
      },
      {
        id: 17,
        title: 'Kidney very long title name lorem ipsum dolor sit amet segmentation',
        description: 'Description for Kidney.',
        colorHex: '#9ACD32',
      },
      {
        id: 18,
        title: 'Gallbladder',
        description: 'Description for Gallbladder.',
        colorHex: '#20B2AA',
      },
      {
        id: 19,
        title: 'Esophagus',
        description: 'Description for Esophagus.',
        colorHex: '#DAA520',
      },
      {
        id: 20,
        title: 'Liver',
        description: 'Description for Liver.',
        colorHex: '#CD5C5C',
      },
      {
        id: 21,
        title: 'Stomach',
        description: 'Description for Stomach.',
        colorHex: '#778899',
      },
      {
        id: 22,
        title: 'Abdominal aorta',
        description: 'Description for Abdominal Aorta.',
        colorHex: '#B8860B',
      },
      {
        id: 23,
        title: 'Inferior vena cava',
        description: 'Description for Inferior Vena Cava.',
        colorHex: '#556B2F',
      },
      {
        id: 24,
        title: 'Portal vein',
        description: 'Description for Portal Vein.',
        colorHex: '#8B4513',
      },
      {
        id: 25,
        title: 'Pancreas',
        description: 'Description for Pancreas.',
        colorHex: '#2F4F4F',
      },
      {
        id: 26,
        title: 'Adrenal gland',
        description: 'Description for Adrenal Gland.',
        colorHex: '#708090',
      },
      {
        id: 27,
        title: 'Adrenal gland',
        description: 'Description for Adrenal Gland.',
        colorHex: '#6A5ACD',
      },
      {
        id: 28,
        title: 'New Seg Test New Seg Test New Seg Test New Seg Test New Seg Test New Seg Test ',
        description: 'Description for New Seg Test.',
        colorHex: '#4682B4',
      },
    ],
  },
];

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
                      <DropdownMenuLabel>Current Segmentation</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Icons.Rename className="text-foreground" />
                        <span className="pl-2">Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Icons.Delete className="text-foreground" />
                        <span className="pl-2">Delete</span>
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
