import React from 'react';
import { PanelSection } from '../PanelSection';
import { useSegmentationTableContext, SegmentationExpandedProvider } from './contexts';
import { SegmentationHeader } from './SegmentationHeader';

export const SegmentationExpanded: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { data, activeSegmentationId, onSegmentationClick, mode } =
    useSegmentationTableContext('SegmentationExpanded');
  debugger;

  // Check if we should render based on mode
  if (mode !== 'expanded' || !data || data.length === 0) {
    return null;
  }

  return (
    <>
      {data.map(segmentationInfo => {
        const isActive = segmentationInfo.segmentation.segmentationId === activeSegmentationId;

        return (
          <PanelSection key={segmentationInfo.segmentation.segmentationId}>
            <SegmentationExpandedProvider
              segmentation={segmentationInfo.segmentation}
              representation={segmentationInfo.representation}
              isActive={isActive}
            >
              <PanelSection.Header
                className={`border-input border-t-2 bg-transparent pl-1 ${isActive ? 'border-primary' : ''}`}
                onClick={() => onSegmentationClick(segmentationInfo.segmentation.segmentationId)}
              >
                <SegmentationHeader />
              </PanelSection.Header>

              <PanelSection.Content>
                <div className="segmentation-expanded-section">{children}</div>
              </PanelSection.Content>
            </SegmentationExpandedProvider>
          </PanelSection>
        );
      })}
    </>
  );
};
