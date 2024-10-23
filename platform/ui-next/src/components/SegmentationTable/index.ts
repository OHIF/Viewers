import React from 'react';

import { SegmentationTable, useSegmentationTableContext } from './SegmentationTable';
import { SegmentationTableConfig } from './SegmentationTableConfig';
import { AddSegmentationRow } from './AddSegmentationRow';
import { AddSegmentRow } from './AddSegmentRow';
import { SegmentationSegments } from './SegmentationSegments';
import { SegmentationSelectorHeader } from './SegmentationSelectorHeader';
import { SegmentationHeader } from './SegmentationHeader';

SegmentationTable.Segments = SegmentationSegments;
SegmentationTable.Config = SegmentationTableConfig;
SegmentationTable.AddSegmentRow = AddSegmentRow;
SegmentationTable.AddSegmentationRow = AddSegmentationRow;
SegmentationTable.SelectorHeader = SegmentationSelectorHeader;
SegmentationTable.Header = SegmentationHeader;

export {
  // context
  useSegmentationTableContext,
  // components
  SegmentationTable,
};
