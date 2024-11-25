import React from 'react';
import { useSegmentationTableContext } from './SegmentationTableContext';
import { PanelSection } from '../PanelSection';
import { SegmentationHeader } from './SegmentationHeader';
import { SegmentationTable } from './SegmentationTable';

export const SegmentationExpanded: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { data } = useSegmentationTableContext('SegmentationExpanded');

  // Separate the Header component from other children
  const headerComponent = React.Children.toArray(children).find(
    child => React.isValidElement(child) && child.type === SegmentationTable.Header
  );
  const otherChildren = React.Children.toArray(children).filter(
    child => !(React.isValidElement(child) && child.type === SegmentationTable.Header)
  );

  return (
    <>
      {data.map(segmentationInfo => (
        <PanelSection key={segmentationInfo.segmentation.segmentationId}>
          <PanelSection.Header className="border-input border-t-2 bg-transparent pl-1">
            {headerComponent ? (
              React.cloneElement(headerComponent as React.ReactElement, {
                segmentation: segmentationInfo.segmentation,
                representation: segmentationInfo.representation,
              })
            ) : (
              <SegmentationHeader
                segmentation={segmentationInfo.segmentation}
                representation={segmentationInfo.representation}
              />
            )}
          </PanelSection.Header>
          <PanelSection.Content>
            <div className="segmentation-expanded-section">
              {React.Children.map(otherChildren, child =>
                React.isValidElement(child)
                  ? React.cloneElement(child, {
                      segmentation: segmentationInfo.segmentation,
                      representation: segmentationInfo.representation,
                    })
                  : child
              )}
            </div>
          </PanelSection.Content>
        </PanelSection>
      ))}
    </>
  );
};
