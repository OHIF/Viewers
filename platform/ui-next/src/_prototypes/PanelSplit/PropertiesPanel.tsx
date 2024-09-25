import React from 'react';
import { Item, Property, DisplayMode, AvailabilityState } from './types';
import { Label } from '../../components/Label';
import { Slider } from '../../components/Slider';
import { Input } from '../../components/Input';
import { Switch } from '../../components/Switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/Tabs';
import { Button } from '../../components/Button';

interface PropertiesPanelProps {
  selectedItem: Item | null;
  onUpdateProperty: (itemId: number, propertyKey: string, newValue: any) => void;
  onAddItem: (itemId: number) => void; // Prop for adding item
}

/**
 * PropertiesPanel Component
 *
 * Displays and manages the properties of the selected item.
 * Renders different content based on the item's availability state.
 *
 * @param selectedItem - The currently selected item.
 * @param onUpdateProperty - Callback to handle property updates.
 * @param onAddItem - Callback to handle adding the item.
 */
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedItem,
  onUpdateProperty,
  onAddItem,
}) => {
  if (!selectedItem) {
    return (
      <div className="text-gray-500">
        <p>No item selected.</p>
      </div>
    );
  }

  if (selectedItem.availability === 'available') {
    return (
      <div className="flex flex-col items-center p-1.5 text-sm">
        {/* "Add this item" Button */}
        <Button
          onClick={() => onAddItem(selectedItem.id)}
          className="mb-4 mt-2"
          variant="default"
        >
          Add this item
        </Button>

        {/* Divider */}
        <div className="border-primary/30 mb-2 w-full border-b"></div>

        {/* Series Name */}
        <div className="text-foreground w-full text-left">
          Series: <span className="text-muted-foreground">{selectedItem.series}</span>
        </div>
      </div>
    );
  }

  if (selectedItem.availability === 'loaded') {
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

    /**
     * Handles changes to the display mode via Tabs.
     *
     * @param newDisplayMode - The new display mode selected.
     */
    const handleDisplayModeChange = (newDisplayMode: DisplayMode) => {
      console.log(`Display mode changed to`, newDisplayMode); // Debug log
      onUpdateProperty(selectedItem.id, 'displayMode', newDisplayMode);
    };

    return (
      <div className="p-1.5 text-sm">
        <div className="items-top mb-2.5 flex justify-between">
          <div className="text-foreground text-sm font-semibold">
            Properties <br />
            <span className="text-muted-foreground font-normal">{selectedItem.name}</span>
          </div>

          {/* Tabs component for Outline and Fill control */}
          <Tabs
            value={selectedItem.displayMode}
            onValueChange={handleDisplayModeChange}
            className="ml-auto"
          >
            <TabsList>
              <TabsTrigger value="Fill & Outline">
                {/* SVG Icon for Fill & Outline */}
                <svg
                  width="18px"
                  height="18px"
                  viewBox="0 0 18 18"
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
                        width="18"
                        height="18"
                      ></rect>
                      <rect
                        id="Rectangle"
                        stroke="#348CFD"
                        x="1.5"
                        y="1.5"
                        width="15"
                        height="15"
                        rx="1"
                      ></rect>
                      <rect
                        id="Rectangle"
                        fill="#348CFD"
                        x="3.5"
                        y="3.5"
                        width="11"
                        height="11"
                        rx="1"
                      ></rect>
                    </g>
                  </g>
                </svg>
              </TabsTrigger>
              <TabsTrigger value="Outline Only">
                {/* SVG Icon for Outline Only */}
                <svg
                  width="18px"
                  height="18px"
                  viewBox="0 0 18 18"
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
                        width="18"
                        height="18"
                      ></rect>
                      <rect
                        id="Rectangle"
                        stroke="#348CFD"
                        x="1.5"
                        y="1.5"
                        width="15"
                        height="15"
                        rx="1"
                      ></rect>
                    </g>
                  </g>
                </svg>
              </TabsTrigger>
              <TabsTrigger value="Fill Only">
                {/* SVG Icon for Fill Only */}
                <svg
                  width="18px"
                  height="18px"
                  viewBox="0 0 18 18"
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
                        width="18"
                        height="18"
                      ></rect>
                      <rect
                        id="Rectangle"
                        fill="#348CFD"
                        x="2"
                        y="2"
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
            <div className="mt-0">
              <TabsContent value="Fill & Outline">
                <p className="text-muted-foreground text-xxs text-center">Fill & Outline</p>
              </TabsContent>
              <TabsContent value="Outline Only">
                <p className="text-muted-foreground text-xxs text-center">Outline Only</p>
              </TabsContent>
              <TabsContent value="Fill Only">
                <p className="text-muted-foreground text-xxs text-center">Fill Only</p>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Properties List */}
        <div className="mb-3 space-y-3">
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
          <div className="text-foreground mb-1">
            <div className="border-primary/30 mb-2 w-full border-b"></div>
            Series: <span className="text-muted-foreground">{selectedItem.series}</span>
          </div>
        )}
      </div>
    );
  }

  // For other availability states, you can add additional conditions if needed
  return (
    <div className="text-gray-500">
      <p>No properties available for the selected item.</p>
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
