// Import components for StudyList namespace
import { defaultColumns } from './columns/defaultColumns';
import { SettingsPopover } from './components/SettingsPopover';
import { PreviewContainer } from './components/PreviewContainer';
import { PreviewHeader } from './components/PreviewHeader';
import { Layout } from './components/Layout';
import { OpenPreviewButton, ClosePreviewButton } from './components/PreviewToggleButton';
import { PreviewContent } from './components/PreviewContent';
import { WorkflowsProvider } from './components/WorkflowsProvider';

// Types
export * from './types/types';

// StudyList compound component namespace
type StudyListNamespace = typeof Layout & {
  Table: typeof Layout.Table;
  Preview: typeof Layout.Preview;
  SettingsPopover: typeof SettingsPopover;
  PreviewContainer: typeof PreviewContainer;
  PreviewHeader: typeof PreviewHeader;
  PreviewContent: typeof PreviewContent;
  WorkflowsProvider: typeof WorkflowsProvider;
  OpenPreviewButton: typeof OpenPreviewButton;
  ClosePreviewButton: typeof ClosePreviewButton;
  defaultColumns: typeof defaultColumns;
};

export const StudyList: StudyListNamespace = Object.assign(Layout, {
  Table: Layout.Table,
  Preview: Layout.Preview,
  SettingsPopover,
  PreviewContainer,
  PreviewHeader,
  PreviewContent,
  WorkflowsProvider,
  OpenPreviewButton,
  ClosePreviewButton,
  defaultColumns,
});
