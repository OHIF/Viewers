// src/_pages/patterns.tsx

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';

import DataRow from '../_prototypes/DataRow/DataRow';
import dataList from '../_prototypes/DataRow/dataList.json';
import actionOptionsMap from '../_prototypes/DataRow/actionOptionsMap';

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
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null); // Changed to string for composite ID

  // Handle actions from DataRow
  const handleAction = (id: string, action: string) => {
    console.log(`Action "${action}" triggered for item with id: ${id}`);
    // Implement actual action logic here
  };

  // Handle row selection
  const handleRowSelect = (id: string) => {
    setSelectedRowId(prevSelectedId => (prevSelectedId === id ? null : id));
  };

  return (
    <div className="my-4 mx-auto max-w-6xl py-6">
      <div className="mb-6 text-3xl">Patterns Page</div>

      {/* Iterate over each list group */}
      {dataList.map((listGroup: ListGroup, groupIndex: number) => (
        <div
          key={`original-${groupIndex}`}
          className="mb-18"
        >
          {/* List Group Title */}
          <h2 className="mb-20 text-2xl font-bold">{listGroup.type}</h2>

          {/* Container for DataRow components */}
          <div className="space-y-px">
            {listGroup.items.map((item, index) => {
              const compositeId = `${item.type}-${item.id}`; // Ensure 'type' is present in DataItem if needed
              return (
                <DataRow
                  key={`original-${compositeId}`} // Prefix to ensure uniqueness
                  number={index + 1}
                  title={item.title}
                  description={item.description}
                  optionalField={item.optionalField}
                  colorHex={item.colorHex}
                  details={item.details}
                  actionOptions={actionOptionsMap[listGroup.type] || ['Action']}
                  onAction={(action: string) => handleAction(compositeId, action)}
                  isSelected={selectedRowId === compositeId}
                  onSelect={() => handleRowSelect(compositeId)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* New 250px Wide Panel */}
      <div className="w-64">
        <div className="space-y-1">
          {dataList.map((listGroup: ListGroup, groupIndex: number) => (
            <div
              key={`panel-${groupIndex}`}
              className="mb-20"
            >
              {/* List Group Title */}
              <h3 className="mb-20 text-xl font-semibold">{listGroup.type}</h3>

              {/* Container for DataRow components */}
              <div className="space-y-px">
                {listGroup.items.map((item, index) => {
                  const compositeId = `${item.type}-${item.id}-panel`; // Unique composite ID for panel
                  return (
                    <DataRow
                      key={`panel-${compositeId}`} // Prefix to ensure uniqueness
                      number={index + 1}
                      title={item.title}
                      description={item.description}
                      optionalField={item.optionalField}
                      colorHex={item.colorHex}
                      details={item.details}
                      actionOptions={actionOptionsMap[listGroup.type] || ['Action']}
                      onAction={(action: string) => handleAction(compositeId, action)}
                      isSelected={selectedRowId === compositeId}
                      onSelect={() => handleRowSelect(compositeId)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Patterns />);
