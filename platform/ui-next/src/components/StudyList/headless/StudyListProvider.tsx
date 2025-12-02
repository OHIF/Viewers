import * as React from 'react';

export type StudyListContextValue<T = any> = {
  selected: T | null;
  setSelected: (row: T | null) => void;

  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;

  seriesViewMode: 'thumbnails' | 'list';
  setSeriesViewMode: (mode: 'thumbnails' | 'list') => void;
};

export const StudyListContext = React.createContext<StudyListContextValue | undefined>(undefined);

export function StudyListProvider<T = any>({
  value,
  children,
}: {
  value: StudyListContextValue<T>;
  children: React.ReactNode;
}) {
  return (
    <StudyListContext.Provider value={value as unknown as StudyListContextValue}>
      {children}
    </StudyListContext.Provider>
  );
}

export function useStudyList<T = any>() {
  const ctx = React.useContext(StudyListContext);
  if (!ctx) {
    throw new Error('useStudyList must be used within <StudyListProvider>');
  }
  return ctx as StudyListContextValue<T>;
}
