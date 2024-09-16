import React from 'react';
import { Item } from './types';

interface PropertiesPanelProps {
  selectedItem: Item | null;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedItem }) => {
  if (!selectedItem) {
    return (
      <div className="text-gray-500">
        <p>No item selected.</p>
      </div>
    );
  }

  const { name, properties } = selectedItem;

  if (!properties || Object.keys(properties).length === 0) {
    return (
      <div className="text-gray-500">
        <p>
          No properties available for <strong>{name}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">
        Properties for <span className="text-blue-600">{name}</span>
      </h3>
      <ul className="space-y-2">
        {Object.entries(properties).map(([key, value]) => (
          <li
            key={key}
            className="flex"
          >
            <span className="w-32 font-medium">{key}:</span>
            <span>{String(value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PropertiesPanel;
