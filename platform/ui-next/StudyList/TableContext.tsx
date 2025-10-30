import * as React from 'react';
import type { StudyRow } from './StudyListTypes';
import type { WorkflowId } from './WorkflowsInfer';

type Ctx = {
  defaultMode: WorkflowId | null;
  onLaunch?: (study: StudyRow, workflow: WorkflowId) => void;
};

const StudyListTableContext = React.createContext<Ctx | undefined>(undefined);

export function StudyListTableProvider({
  value,
  children,
}: {
  value: Ctx;
  children: React.ReactNode;
}) {
  return <StudyListTableContext.Provider value={value}>{children}</StudyListTableContext.Provider>;
}

export function useStudyListTableContext() {
  const ctx = React.useContext(StudyListTableContext);
  if (!ctx) {
    throw new Error('useStudyListTableContext must be used within StudyListTableProvider');
  }
  return ctx;
}