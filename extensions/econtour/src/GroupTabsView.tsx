import React, { createContext, useContext, useState } from 'react';

// Create a context to track the active group tab
interface GroupTabsContextType {
  activeGroup: string;
  setActiveGroup: (group: string) => void;
}

const GroupTabsContext = createContext<GroupTabsContextType | undefined>(undefined);

export const useGroupTabs = (): GroupTabsContextType => {
  const context = useContext(GroupTabsContext);
  if (!context) {
    throw new Error('useGroupTabs must be used within a GroupTabsProvider');
  }
  return context;
};

export const GroupTabsProvider: React.FC<{
  children: React.ReactNode;
  defaultGroup?: string;
}> = ({ children, defaultGroup = 'All' }) => {
  const [activeGroup, setActiveGroup] = useState<string>(defaultGroup);
  return (
    <GroupTabsContext.Provider value={{ activeGroup, setActiveGroup }}>
      {children}
    </GroupTabsContext.Provider>
  );
};

// GroupTabsView is a wrapper component that provides the active group context
export const GroupTabsView: React.FC<{
  children: React.ReactNode;
  defaultGroup?: string;
}> = ({ children, defaultGroup }) => {
  return <GroupTabsProvider defaultGroup={defaultGroup}>{children}</GroupTabsProvider>;
};
