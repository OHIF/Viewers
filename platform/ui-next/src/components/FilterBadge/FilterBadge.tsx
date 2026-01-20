import React from 'react';

interface FilterBadgeProps {
  count: number;
}

const FilterBadge: React.FC<FilterBadgeProps> = ({ count }) => {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="bg-primary-main ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white">
      {count}
    </span>
  );
};

export { FilterBadge };
