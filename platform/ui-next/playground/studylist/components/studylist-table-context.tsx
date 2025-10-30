import * as React from 'react';
import type { StudyRow } from '../types';

type Ctx = {
  defaultMode: string | null;
  onLaunch?: (study: StudyRow, workflow: string) => void;
};

const StudylistTableContext = React.createContext<Ctx | undefined>(undefined);

export function StudylistTableProvider({
  value,
  children,
}: {
  value: Ctx;
  children: React.ReactNode;
}) {
  return (
    <StudylistTableContext.Provider value={value}>{children}</StudylistTableContext.Provider>
  );
}

export function useStudylistTableContext() {
  const ctx = React.useContext(StudylistTableContext);
  if (!ctx) {
    throw new Error('useStudylistTableContext must be used within StudylistTableProvider');
  }
  return ctx;
}