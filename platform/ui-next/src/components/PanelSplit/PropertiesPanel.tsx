import React from 'react';
import { Item, Property } from './types';
import { Label } from '../Label';
import { Slider } from '../Slider';
import { Input } from '../Input';
import { Switch } from '../Switch';

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
    onUpdateProperty(selectedItem.id, property.key, newValue);
  };

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">
        Properties for <span className="text-blue-600">{selectedItem.name}</span>
      </h3>
      <div className="space-y-4">
        {selectedItem.properties.map(prop => (
          <div
            key={prop.key}
            className="flex items-center space-x-4"
          >
            {/* Label for the property */}
            <Label htmlFor={prop.key}>{prop.label}</Label>

            {/* Render input components based on property type */}
            {renderPropertyInput(prop, handleChange)}
          </div>
        ))}
      </div>
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
            value={[prop.value as number]} // Pass as an array
            min={prop.min}
            max={prop.max}
            step={prop.step}
            onValueChange={values => handleChange(prop, values[0])} // Handle array input
            className="w-32"
          />
          <Input
            type="number"
            id={prop.key}
            value={prop.value as number}
            min={prop.min}
            max={prop.max}
            step={prop.step}
            onChange={e => handleChange(prop, Number(e.target.value))}
            className="w-16"
          />
        </>
      );

    case 'boolean':
      return (
        <Switch
          id={prop.key}
          checked={prop.value as boolean}
          onCheckedChange={checked => handleChange(prop, checked)} // Correct prop name
        />
      );

    // Add more cases if you have other property types
    default:
      return null;
  }
};

export default PropertiesPanel;
