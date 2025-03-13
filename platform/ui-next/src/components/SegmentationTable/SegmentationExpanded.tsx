import React from 'react';
import { PanelSection } from '../PanelSection';
import { useSegmentationTableContext, SegmentationExpandedProvider } from './contexts';
import { SegmentationTable } from './SegmentationTable';

export const SegmentationExpanded: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { data, activeSegmentationId, onSegmentationClick, mode } =
    useSegmentationTableContext('SegmentationExpanded');

  // Check if we should render based on mode
  if (mode !== 'expanded' || !data || data.length === 0) {
    return null;
  }

  const headerComponent = React.Children.toArray(children).find(
    child => React.isValidElement(child) && child.type === SegmentationTable.Header
  );

  const otherChildren = React.Children.toArray(children).filter(
    child => !(React.isValidElement(child) && child.type === SegmentationTable.Header)
  );

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
                onClick={e => {
                  e.stopPropagation();
                  onSegmentationClick(segmentationInfo.segmentation.segmentationId);
                }}
              >
                {headerComponent}
              </PanelSection.Header>

              <PanelSection.Content>
                <div className="segmentation-expanded-section">{otherChildren}</div>
              </PanelSection.Content>
            </SegmentationExpandedProvider>
          </PanelSection>
        );
      })}
    </>
  );
};
