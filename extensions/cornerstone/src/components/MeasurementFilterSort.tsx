import React, { useState } from 'react';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Icons,
} from '@ohif/ui-next';

interface MeasurementFilterSortProps {
  onFilterChange: (filterText: string) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export function MeasurementFilterSort({
  onFilterChange,
  onSortChange,
}: MeasurementFilterSortProps) {
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterText(value);
    onFilterChange(value);
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    onSortChange(value, sortOrder);
  };

  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    onSortChange(sortBy, newOrder);
  };

  return (
    <div className="mb-2 mt-2 space-y-2 px-2">
      {/* Filter Input */}
      <div className="relative">
        <Icons.Search className="text-muted-foreground absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Filter by name or value..."
          value={filterText}
          onChange={handleFilterChange}
          className="pl-8"
        />
      </div>

      {/* Sort Controls */}
      <div className="flex items-center space-x-2">
        <Select
          value={sortBy}
          onValueChange={handleSortByChange}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="value">Sort by Value</SelectItem>
          </SelectContent>
        </Select>

        <button
          onClick={handleSortOrderToggle}
          className="border-input hover:bg-primary/10 flex h-7 items-center justify-center rounded border px-2 transition-colors"
          title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sortOrder === 'asc' ? (
            <Icons.SortingAscending className="h-4 w-4" />
          ) : (
            <Icons.SortingDescending className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default MeasurementFilterSort;
