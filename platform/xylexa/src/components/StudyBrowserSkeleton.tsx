import React from 'react';

export const StudyBrowserSkeleton = () => {
  return (
    <div className="animate-pulse p-2">
      <div className="bg-popover flex h-[50px] items-center justify-between rounded px-4">
        <div className="flex flex-col space-y-1">
          <div className="bg-muted h-4 w-24 rounded" />
          <div className="bg-muted h-4 w-40 rounded" />
        </div>
        <div className="flex flex-col items-end space-y-1">
          <div className="bg-muted h-3 w-20 rounded" />
          <div className="bg-muted h-3 w-8 rounded" />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-muted h-24 w-full rounded"
          />
        ))}
      </div>
    </div>
  );
};

export default StudyBrowserSkeleton;
