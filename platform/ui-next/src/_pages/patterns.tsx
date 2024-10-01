// src/_pages/patterns.tsx

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';

// Component imports
import DataRow from '../_prototypes/DataRow/DataRow';
import dataList from '../_prototypes/DataRow/dataList.json';
import actionOptionsMap from '../_prototypes/DataRow/actionOptionsMap';

// TypeScript interfaces (if using TypeScript)
interface DataItem {
  id: number;
  title: string;
  description: string;
  optionalField?: string;
  colorHex?: string;
  details?: string;
}

interface ListGroup {
  type: string;
  items: DataItem[];
}

function Patterns() {
  // State to track the selected row ID
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  // Handle actions from DataRow
  const handleAction = (id: number, action: string) => {
    console.log(`Action "${action}" triggered for item with id: ${id}`);
    // Implement actual action logic here
  };

  // Handle row selection
  const handleRowSelect = (id: number) => {
    setSelectedRowId(prevSelectedId => (prevSelectedId === id ? null : id));
  };

  return (
    <div className="my-4 mx-auto max-w-6xl py-6">
      <div className="mb-6 text-3xl">Patterns Page</div>

      {/* Iterate over each list group */}
      {dataList.map((listGroup: ListGroup, groupIndex: number) => (
        <div
          key={groupIndex}
          className="mb-8"
        >
          {/* List Group Title */}
          <h2 className="mb-4 text-2xl font-bold">{listGroup.type}</h2>

          {/* Container for DataRow components */}
          <div className="space-y-px">
            {' '}
            {listGroup.items.map((item, index) => (
              <DataRow
                key={item.id}
                number={index + 1}
                title={item.title}
                description={item.description}
                optionalField={item.optionalField}
                colorHex={item.colorHex}
                details={item.details}
                actionOptions={actionOptionsMap[listGroup.type] || ['Action']}
                onAction={(action: string) => handleAction(item.id, action)}
                isSelected={selectedRowId === item.id}
                onSelect={() => handleRowSelect(item.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Patterns />);
