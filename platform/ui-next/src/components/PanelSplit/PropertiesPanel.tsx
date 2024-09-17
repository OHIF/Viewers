// src/components/PanelSplit/PropertiesPanel.tsx

import React from 'react';
import { Item, Property } from './types';
import { Label } from '../Label';
import { Slider } from '../Slider';
import { Input } from '../Input';
import { Switch } from '../Switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../Tabs';

interface PropertiesPanelProps {
  selectedItem: Item | null;
  onUpdateProperty: (itemId: number, propertyKey: string, newValue: any) => void;
}

/**
 * PropertiesPanel Component
 *
 * Displays and manages the properties of the selected item.
 * Renders different input components based on the property's type.
 *
 * @param selectedItem - The currently selected item.
 * @param onUpdateProperty - Callback to handle property updates.
 */
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedItem, onUpdateProperty }) => {
  if (!selectedItem) {
    return (
      <div className="text-gray-500">
        <p>No item selected.</p>
      </div>
    );
  }

  /**
   * Handles changes to a property's value.
   *
   * @param property - The property being updated.
   * @param newValue - The new value for the property.
   */
  const handleChange = (property: Property, newValue: any) => {
    console.log(`Updating property '${property.key}' to`, newValue); // Debug log
    onUpdateProperty(selectedItem.id, property.key, newValue);
  };

  // Determine if the selected item is the master
  const isMaster = selectedItem.controlsAll;

  return (
    <div className="p-1.5 text-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-foreground text-sm font-semibold">
          Properties <br />
          <span className="text-muted-foreground font-normal">{selectedItem.name}</span>
        </div>

        {/* Tabs component placed to the right of the "Properties" text */}
        <Tabs
          defaultValue="tab1"
          className="ml-auto"
        >
          <TabsList>
            <TabsTrigger value="tab1">1{/* Your custom SVG for the first tab */}</TabsTrigger>
            <TabsTrigger value="tab2">2 {/* Your custom SVG for the second tab */}</TabsTrigger>
            <TabsTrigger value="tab3">3{/* Your custom SVG for the third tab */}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Properties List */}
      <div className="space-y-4">
        {selectedItem.properties.map(prop => (
          <div
            key={prop.key}
            className="flex items-center justify-between space-x-4"
          >
            {/* Label takes up space and doesn't wrap */}
            <Label
              htmlFor={prop.key}
              className="flex-grow whitespace-nowrap"
            >
              {prop.label}
            </Label>
            {/* Flex container for input elements, with spacing */}
            <div className="flex items-center space-x-3">
              {renderPropertyInput(prop, handleChange)}
            </div>
          </div>
        ))}
      </div>

      {/* Conditionally render the details section for non-master items */}
      {!isMaster && (
        <div className="mt-4">
          <p className="font-medium">Name: {selectedItem.name}</p>
          <p className="font-medium">
            Series: <span className="text-gray-700">{selectedItem.series}</span>
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Renders the appropriate input component based on the property's type.
 *
 * @param prop - The property to render.
 * @param handleChange - Function to handle value changes.
 * @returns JSX Element corresponding to the property type.
 */
const renderPropertyInput = (
  prop: Property,
  handleChange: (prop: Property, value: any) => void
) => {
  switch (prop.type) {
    case 'slider':
      return (
        <>
          <Slider
            id={prop.key}
            value={[prop.value as number]} // Pass as an array for Radix UI Slider
            min={prop.min}
            max={prop.max}
            step={prop.step}
            onValueChange={values => {
              console.log(`Slider '${prop.key}' changed to`, values[0]); // Debug log
              handleChange(prop, values[0]);
            }}
            className="w-28"
          />
          <Input
            type="number"
            id={prop.key}
            value={prop.value as number}
            min={prop.min}
            max={prop.max}
            step={prop.step}
            onChange={e => {
              const newVal = Number(e.target.value);
              console.log(`Input '${prop.key}' changed to`, newVal); // Debug log
              handleChange(prop, newVal);
            }}
            className="w-14"
          />
        </>
      );

    case 'boolean':
      return (
        <Switch
          id={prop.key}
          checked={prop.value as boolean}
          onCheckedChange={checked => {
            console.log(`Switch '${prop.key}' toggled to`, checked); // Debug log
            handleChange(prop, checked);
          }}
        />
      );

    // Add more cases if you have other property types
    default:
      return null;
  }
};

export default PropertiesPanel;
