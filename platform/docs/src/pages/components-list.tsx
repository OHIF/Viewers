import React from 'react';
import '../css/custom.css';
import Layout from '@theme/Layout';
import { TooltipProvider } from '../../../ui-next/src/components/Tooltip';

// Import all showcase components
import ButtonShowcase from './components/ButtonShowcase';
import CheckboxShowcase from './components/CheckboxShowcase';
import DataRowShowcase from './components/DataRowShowcase';
import DropdownMenuShowcase from './components/DropdownMenuShowcase';
import InputShowcase from './components/InputShowcase';
import ScrollAreaShowcase from './components/ScrollAreaShowcase';
import SelectShowcase from './components/SelectShowcase';
import SliderShowcase from './components/SliderShowcase';
import SwitchShowcase from './components/SwitchShowcase';
import TabsShowcase from './components/TabsShowcase';
import ToastShowcase from './components/ToastShowcase';
import ToolButtonShowcase from './components/ToolButtonShowcase';
import ToolButtonListShowcase from './components/ToolButtonListShowcase';
import NumericMetaShowcase from './components/NumericMetaShowcase';
/**
 * Components List page that displays all available UI components
 */
export default function ComponentsList() {
  return (
    <Layout
      title="Components"
      description="OHIF Viewer Components"
    >
      <TooltipProvider>
        <div className="text-foreground min-h-screen bg-black">
          <div className="mx-auto my-4 max-w-5xl pt-4 pb-6">
            <div className="ml-6 mb-6 text-base">
              <h1 className="text-foreground mb-3 text-5xl">Components</h1>
            </div>
            <TabsShowcase />

            <ButtonShowcase />
            <CheckboxShowcase />
            <DataRowShowcase />
            <DropdownMenuShowcase />
            <InputShowcase />
            <ScrollAreaShowcase />
            <SelectShowcase />
            <SliderShowcase />
            <SwitchShowcase />
            <TabsShowcase />
            <ToastShowcase />
            <ToolButtonShowcase />
            <ToolButtonListShowcase />
            <NumericMetaShowcase />
          </div>
        </div>
      </TooltipProvider>
    </Layout>
  );
}
