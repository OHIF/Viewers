import * as React from 'react';

export type StudyListContextValue<T = any, W extends string = string> = {
  selected: T | null;
  setSelected: (row: T | null) => void;

  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;

  defaultWorkflow: W | null;
  setDefaultWorkflow: (wf: W | null) => void;

  availableWorkflowsFor: (row: Partial<T> | null | undefined) => readonly W[];

  launch: (row: T, wf: W) => void;
};

export const StudyListContext = React.createContext<StudyListContextValue | undefined>(undefined);

export function StudyListProvider<T = any, W extends string = string>({
  value,
  children,
}: {
  value: StudyListContextValue<T, W>;
  children: React.ReactNode;
}) {
  return (
    <StudyListContext.Provider value={value as unknown as StudyListContextValue}>
      {children}
    </StudyListContext.Provider>
  );
}

export function useStudyList<T = any, W extends string = string>() {
  const ctx = React.useContext(StudyListContext);
  if (!ctx) {
    throw new Error('useStudyList must be used within <StudyListProvider>');
  }
  return ctx as StudyListContextValue<T, W>;
}
