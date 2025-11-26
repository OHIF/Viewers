import React, { useState, useMemo } from 'react';
import { MeasurementTable } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import MeasurementFilterSort from './MeasurementFilterSort';

/**
 * Filters measurements based on filter text matching name or value
 */
function filterMeasurements(measurements, filterText) {
  if (!filterText) {
    return measurements;
  }

  const lowerFilter = filterText.toLowerCase();
  return measurements.filter(measurement => {
    // Filter by label/name
    if (measurement.label?.toLowerCase().includes(lowerFilter)) {
      return true;
    }

    // Filter by display text values
    if (measurement.displayText) {
      const primaryTexts = measurement.displayText.primary || [];
      const secondaryTexts = measurement.displayText.secondary || [];
      const allTexts = [...primaryTexts, ...secondaryTexts];

      return allTexts.some(text => text?.toString().toLowerCase().includes(lowerFilter));
    }

    return false;
  });
}

/**
 * Sorts measurements by name or value
 */
function sortMeasurements(measurements, sortBy, sortOrder) {
  const sorted = [...measurements].sort((a, b) => {
    let result = 0;

    if (sortBy === 'name') {
      // Sort by label/name
      const compareA = (a.label || '').toLowerCase();
      const compareB = (b.label || '').toLowerCase();
      
      if (compareA < compareB) result = -1;
      else if (compareA > compareB) result = 1;
    } else if (sortBy === 'value') {
      // Sort by first primary display text value (typically the measurement value)
      const aValue = a.displayText?.primary?.[0] || '';
      const bValue = b.displayText?.primary?.[0] || '';

      // Try to extract numeric values if present
      const aNum = parseFloat(aValue.toString().match(/[\d.]+/)?.[0] || '0');
      const bNum = parseFloat(bValue.toString().match(/[\d.]+/)?.[0] || '0');

      // If both are valid numbers, compare numerically
      if (!isNaN(aNum) && !isNaN(bNum)) {
        result = aNum - bNum;
      } else {
        // Otherwise compare as strings
        const compareA = aValue.toString().toLowerCase();
        const compareB = bValue.toString().toLowerCase();
        
        if (compareA < compareB) result = -1;
        else if (compareA > compareB) result = 1;
      }
    }

    // Apply sort order
    return sortOrder === 'asc' ? result : -result;
  });

  return sorted;
}

/**
 * This is a measurement table that is designed to be nested inside
 * the accordion groups.
 */
export default function MeasurementTableNested(props) {
  const { title, items, group, customHeader } = props;
  const { commandsManager } = useSystem();
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const onAction = (e, command, uid) => {
    commandsManager.run(command, { uid, annotationUID: uid, displayMeasurements: items });
  };

  const handleFilterChange = text => {
    setFilterText(text);
  };

  const handleSortChange = (by, order) => {
    setSortBy(by);
    setSortOrder(order);
  };

  // Apply filtering and sorting
  const processedItems = useMemo(() => {
    let result = items || [];
    result = filterMeasurements(result, filterText);
    result = sortMeasurements(result, sortBy, sortOrder);
    return result;
  }, [items, filterText, sortBy, sortOrder]);

  return (
    <MeasurementTable
      title={title ? title : `Measurements`}
      data={processedItems}
      onAction={onAction}
      {...group}
      key={group.key}
    >
      <MeasurementTable.Header key="measurementTableHeader">
        {customHeader && group.isFirst && customHeader({ ...props, items: props.allItems })}
        {group.isFirst && (
          <MeasurementFilterSort
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
          />
        )}
      </MeasurementTable.Header>
      <MeasurementTable.Body key="measurementTableBody" />
    </MeasurementTable>
  );
}
