import React from 'react';
import { Button, Icons, Label, Slider, Input, Switch, Tabs, TabsList, TabsTrigger, TabsContent } from '@ohif/ui-next';


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
const PropertiesPanel: React.FC = ({
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
    const handleChange = (property, newValue: any) => {
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
    const handleDisplayModeChange = (newDisplayMode) => {
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
                <Icons.FillAndOutline />
              </TabsTrigger>
              <TabsTrigger value="Outline Only">
                <Icons.OutlineOnly />
              </TabsTrigger>
              <TabsTrigger value="Fill Only">
                {/* SVG Icon for Fill Only */}
                <Icons.FillOnly />
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
  prop,
  handleChange: (prop, value: any) => void
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
