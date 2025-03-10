import React from 'react';
import { DataRow } from '../../../../ui-next/src/components/DataRow';

// Mock data to demonstrate DataRow usage
const mockData = [
  {
    id: 1,
    title: 'Segment 1',
    description: 'Description for Segment 1',
    optionalField: 'Optional Info 1',
    colorHex: '#FF5733',
    details: 'Secondary details or text',
  },
  {
    id: 2,
    title: 'Segment 2',
    description: 'Description for Segment 2',
    optionalField: 'Optional Info 2',
    colorHex: '#33C1FF',
    details: 'Secondary details or text',
  },
  {
    id: 3,
    title: 'Segment 3',
    description: 'Description for Segment 3',
    optionalField: 'Optional Info 3',
    colorHex: '#5533FF',
    details: 'Secondary details or text',
  },
];

// Mock action options map
const actionOptionsMap = {
  'ROI Tools': ['Edit', 'Delete', 'View'],
};

interface DataItem {
  id: number;
  title: string;
  description: string;
  optionalField?: string;
  colorHex?: string;
  details?: string;
  series?: string;
}

interface ListGroup {
  type: string;
  items: DataItem[];
}

const DataRowExample: React.FC = () => {
  const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);

  const handleAction = (id: string, action: string) => {
    console.log(`Action "${action}" triggered for item with id: ${id}`);
    // Implement actual action logic here
  };

  const handleRowSelect = (id: string) => {
    setSelectedRowId(prevSelectedId => (prevSelectedId === id ? null : id));
  };

  return (
    <div className="w-[280px] space-y-px">
      {mockData.map((item, index) => {
        const compositeId = `ROI Tools-${item.id}-panel`; // Ensure unique composite ID
        return (
          <DataRow
            key={`panel-${compositeId}`} // Prefix to ensure uniqueness
            number={index + 1}
            title={item.title}
            description={item.description}
            optionalField={item.optionalField}
            colorHex={item.colorHex}
            details={item.details}
            series={item.series}
            actionOptions={actionOptionsMap['ROI Tools'] || ['Action']}
            onAction={(action: string) => handleAction(compositeId, action)}
            isSelected={selectedRowId === compositeId}
            onSelect={() => handleRowSelect(compositeId)}
          />
        );
      })}
    </div>
  );
};

export default DataRowExample;
