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

        {/* Tabs component for Outline and Fill control */}
        <Tabs
          defaultValue="tab1"
          className="ml-auto"
        >
          <TabsList>
            <TabsTrigger value="tab1">
              <svg
                width="20px"
                height="20px"
                viewBox="0 0 20 20"
              >
                <g
                  id="view-outline-fill"
                  stroke="none"
                  strokeWidth="1"
                  fill="none"
                  fillRule="evenodd"
                >
                  <g id="Group-13">
                    <rect
                      id="Rectangle"
                      x="0"
                      y="0"
                      width="20"
                      height="20"
                    ></rect>
                    <rect
                      id="Rectangle"
                      stroke="#348CFD"
                      x="2.5"
                      y="2.5"
                      width="15"
                      height="15"
                      rx="1"
                    ></rect>
                    <rect
                      id="Rectangle"
                      fill="#348CFD"
                      x="4.5"
                      y="4.5"
                      width="11"
                      height="11"
                      rx="1"
                    ></rect>
                  </g>
                </g>
              </svg>
            </TabsTrigger>
            <TabsTrigger value="tab2">
              <svg
                width="20px"
                height="20px"
                viewBox="0 0 20 20"
              >
                <g
                  id="view-outline"
                  stroke="none"
                  strokeWidth="1"
                  fill="none"
                  fillRule="evenodd"
                >
                  <g id="Group-13">
                    <rect
                      id="Rectangle"
                      x="0"
                      y="0"
                      width="20"
                      height="20"
                    ></rect>
                    <rect
                      id="Rectangle"
                      stroke="#348CFD"
                      x="2.5"
                      y="2.5"
                      width="15"
                      height="15"
                      rx="1"
                    ></rect>
                  </g>
                </g>
              </svg>
            </TabsTrigger>
            <TabsTrigger value="tab3">
              <svg
                width="20px"
                height="20px"
                viewBox="0 0 20 20"
                version="1.1"
              >
                <g
                  id="view-fill"
                  stroke="none"
                  strokeWidth="1"
                  fill="none"
                  fillRule="evenodd"
                >
                  <g id="Group-13">
                    <rect
                      id="Rectangle"
                      x="0"
                      y="0"
                      width="20"
                      height="20"
                    ></rect>
                    <rect
                      id="Rectangle"
                      fill="#348CFD"
                      x="3"
                      y="3"
                      width="14"
                      height="14"
                      rx="1"
                    ></rect>
                  </g>
                </g>
              </svg>
            </TabsTrigger>
          </TabsList>

          {/* Display dynamic text under the tabs */}
          <div className="mt-2">
            <TabsContent value="tab1">
              <p className="text-muted-foreground text-xxs text-center">Outline & Fill</p>{' '}
              {/* Text for tab 1 */}
            </TabsContent>
            <TabsContent value="tab2">
              <p className="text-muted-foreground text-xxs text-center">Outline Only</p>{' '}
              {/* Text for tab 2 */}
            </TabsContent>
            <TabsContent value="tab3">
              <p className="text-muted-foreground text-xxs text-center">Fill Only</p>{' '}
              {/* Text for tab 3 */}
            </TabsContent>
          </div>
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
        <div className="text-foreground mt-3">
          <div className="border-primary/30 mb-2 w-full border-b"></div>
          Series: <span className="text-muted-foreground">{selectedItem.series}</span>
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
