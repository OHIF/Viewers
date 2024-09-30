import React from 'react';

export function StudyBrowserViewOptions({ tabs, onSelectTab, activeTabName }: withAppTypes) {
  const handleTabChange = (tabName: string) => {
    onSelectTab(tabName);
  };

  return (
    <div className="border-inputfield-main focus:border-inputfield-main flex h-[26px] w-[125px] items-center justify-center rounded border bg-black p-2">
      <select
        onChange={e => handleTabChange(e.target.value)}
        value={activeTabName}
        onClick={e => e.stopPropagation()}
        className="w-full appearance-none bg-transparent text-sm leading-tight text-white shadow transition duration-300 focus:outline-none"
      >
        {tabs.map(tab => {
          const { name, label, studies } = tab;
          const isActive = activeTabName === name;
          const isDisabled = !studies.length;
          if (isDisabled) {
            return null;
          }
          return (
            <option
              className={`appearance-none bg-black text-white ${isActive ? 'font-bold' : ''}`}
              value={name}
              key={name}
            >
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
