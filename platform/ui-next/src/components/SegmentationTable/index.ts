import { SegmentationTable } from './SegmentationTable';
import { SegmentationTableConfig } from './SegmentationTableConfig';
import { AddSegmentationRow } from './AddSegmentationRow';
import { AddSegmentRow } from './AddSegmentRow';
import { SegmentationSegments } from './SegmentationSegments';
import {
  useSegmentationTableContext,
  useSegmentStatistics,
  useSegmentationExpanded,
} from './contexts';

SegmentationTable.Segments = SegmentationSegments;
SegmentationTable.Config = SegmentationTableConfig;
SegmentationTable.AddSegmentRow = AddSegmentRow;
SegmentationTable.AddSegmentationRow = AddSegmentationRow;

export {
  // context
  useSegmentationTableContext,
  useSegmentStatistics,
  useSegmentationExpanded,
  // components
  SegmentationTable,
};
