// src/_pages/patterns.tsx

import React, { useState } from 'react';
import {
  Button,
  Icons,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  DataRow,
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

export default function Measurements() {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const handleAction = (id: string, action: string) => {
    console.log(`Action "${action}" triggered for item with id: ${id}`);
    // Implement actual action logic here
  };
  const handleRowSelect = (id: string) => {
    setSelectedRowId(prevSelectedId => (prevSelectedId === id ? null : id));
  };

  const organSegmentationGroup = dataList.find(
    (listGroup: ListGroup) => listGroup.type === 'Organ Segmentation'
  );
  const roiToolsGroup = dataList.find((listGroup: ListGroup) => listGroup.type === 'ROI Tools');

  if (!organSegmentationGroup) {
    return <div className="text-red-500">Organ Segmentation data not found.</div>;
  }

  if (!roiToolsGroup) {
    return <div className="text-red-500">ROI Tools data not found.</div>;
  }

  return (
    <div className="my-4 flex max-w-6xl justify-end bg-black py-6">
      {/* Simulated Panel List for "Segmentation" */}
      <div className="w-64 space-y-0">
        <Accordion
          type="multiple"
          defaultValue={['measurements-list', 'measurements-additional']}
          collapsible
        >
          {/* Segmentation Tools */}
          <AccordionItem value="measurements-list">
            <AccordionTrigger className="bg-popover hover:bg-accent text-muted-foreground my-0.5 flex h-7 w-full items-center justify-between rounded py-2 pr-1 pl-2 font-normal">
              <span>Measurements</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="mx-2 my-0">
                <div className="text-foreground text-sm">2024-Jan-01</div>
                <div className="text-muted-foreground border-input border-b-2 pb-1 text-sm">
                  Study title lorem ipsum
                </div>
              </div>

              <div className="flex h-9 w-full items-center rounded pr-0.5">
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="pl-1.5"
                  >
                    <Icons.Download />
                    <span className="pl-1">CSV</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="pl-0.5"
                  >
                    <Icons.Add />
                    Create DICOM SR
                  </Button>
                </div>
              </div>
              <div className="space-y-px">
                {roiToolsGroup.items.map((item, index) => {
                  const compositeId = `${roiToolsGroup.type}-${item.id}-panel`; // Ensure unique composite ID
                  return (
                    <DataRow
                      key={`panel-${compositeId}`} // Prefix to ensure uniqueness
                      number={index + 1}
                      title={item.title}
                      description={item.description}
                      optionalField={item.optionalField}
                      colorHex={item.colorHex}
                      details={item.details}
                      series={item.series} // Pass the new series field
                      actionOptions={actionOptionsMap[roiToolsGroup.type] || ['Action']}
                      onAction={(action: string) => handleAction(compositeId, action)}
                      isSelected={selectedRowId === compositeId}
                      onSelect={() => handleRowSelect(compositeId)}
                    />
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Additional Findings */}
          <AccordionItem value="measurements-additional">
            <AccordionTrigger className="bg-popover hover:bg-accent text-muted-foreground my-0.5 flex h-7 w-full items-center justify-between rounded py-2 pr-1 pl-2 font-normal">
              <span>Additional Findings</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-muted mb-0.5 h-12 rounded-b pb-3"></div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
