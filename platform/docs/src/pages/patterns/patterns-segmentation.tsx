'use client';

import React, { useState } from 'react';

import { panelSegmentationData } from '../../../../ui-next/assets/data';
import { SegmentationTable } from '../../../../ui-next/src/components/SegmentationTable';
import { TooltipProvider } from '../../../../ui-next/src/components/Tooltip';

export default function SegmentationPanel() {
  const tableProps = panelSegmentationData;
  tableProps.mode = 'expanded';

  const renderSegments = () => {
    return (
      <SegmentationTable.Segments>
        <SegmentationTable.SegmentStatistics.Header></SegmentationTable.SegmentStatistics.Header>
        <SegmentationTable.SegmentStatistics.Body />
      </SegmentationTable.Segments>
    );
  };

  // Render content based on mode
  const renderModeContent = () => {
    if (tableProps.mode === 'collapsed') {
      return (
        <SegmentationTable.Collapsed>
          <SegmentationTable.Collapsed.Header>
            <SegmentationTable.Collapsed.DropdownMenu>
              {/* <CustomDropdownMenuContent /> */}
            </SegmentationTable.Collapsed.DropdownMenu>
            <SegmentationTable.Collapsed.Selector />
            <SegmentationTable.Collapsed.Info />
          </SegmentationTable.Collapsed.Header>
          <SegmentationTable.Collapsed.Content>
            <SegmentationTable.AddSegmentRow />
            {renderSegments()}
          </SegmentationTable.Collapsed.Content>
        </SegmentationTable.Collapsed>
      );
    }

    return (
      <>
        <SegmentationTable.Expanded>
          <SegmentationTable.Expanded.Header>
            <SegmentationTable.Expanded.DropdownMenu>
              {/* <CustomDropdownMenuContent /> */}
            </SegmentationTable.Expanded.DropdownMenu>
            <SegmentationTable.Expanded.Label />
            <SegmentationTable.Expanded.Info />
          </SegmentationTable.Expanded.Header>

          <SegmentationTable.Expanded.Content>
            <SegmentationTable.AddSegmentRow />
            {renderSegments()}
          </SegmentationTable.Expanded.Content>
        </SegmentationTable.Expanded>
      </>
    );
  };

  return (
    <div className="px-auto flex min-h-screen w-full justify-center border-2 bg-black py-64">
      <TooltipProvider>
        <SegmentationTable {...tableProps}>
          <SegmentationTable.Config />
          <SegmentationTable.AddSegmentationRow />
          {renderModeContent()}
        </SegmentationTable>
      </TooltipProvider>
    </div>
  );
}
