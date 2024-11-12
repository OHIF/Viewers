import React, { useState } from 'react';
import { Button } from '../../../../ui-next/src/components/Button';
import { Icons } from '../../../../ui-next/src/components/Icons';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../../../../ui-next/src/components/Accordion';
import { DataRow } from '../../../../ui-next/src/components/DataRow';
import { actionOptionsMap, dataList } from '../../../../ui-next/assets/data';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { TooltipProvider } from '../../../../ui-next/src/components/Tooltip';

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
    listGroup => listGroup.type === 'Organ Segmentation'
  );
  const roiToolsGroup = dataList.find(listGroup => listGroup.type === 'ROI Tools');

  if (!organSegmentationGroup || !roiToolsGroup) {
    return null; // Avoid rendering until these groups are ready.
  }

  return (
    <BrowserOnly>
      {() => (
        <div className="px-auto my-4 flex min-h-screen w-full justify-center bg-black py-12">
          <TooltipProvider>
            {/* Simulated Panel List for "Segmentation" */}
            <div className="w-64 space-y-0">
              <Accordion
                type="multiple"
                defaultValue={['measurements-list', 'measurements-additional']}
                tabIndex={0}
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
          </TooltipProvider>
        </div>
      )}
    </BrowserOnly>
  );
}
