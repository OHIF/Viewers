import React from 'react';
import '../css/custom.css';
import Layout from '@theme/Layout';
import { TooltipProvider } from '../../../ui-next/src/components/Tooltip';

// Navigation card components
import { Card, CardHeader, CardTitle, CardDescription } from '../../../ui-next/src/components/Card';
import { Icons } from '../../../ui-next/src/components/Icons';

/* Showcase components (alphabetical) */
import AllinOneMenuShowcase from './components/AllinOneMenuShowcase';
import ButtonShowcase from './components/ButtonShowcase';
import CheckboxShowcase from './components/CheckboxShowcase';
import CinePlayerShowcase from './components/CinePlayerShowcase';
import ComboboxShowcase from './components/ComboboxShowcase';
import DataRowShowcase from './components/DataRowShowcase';
import DialogShowcase from './components/DialogShowcase';
import DropdownMenuShowcase from './components/DropdownMenuShowcase';
import HoverCardShowcase from './components/HoverCardShowcase';
import InputShowcase from './components/InputShowcase';
import LabelShowcase from './components/LabelShowcase';
import NumericMetaShowcase from './components/NumericMetaShowcase';
import PanelSectionShowcase from './components/PanelSectionShowcase';
import PopoverShowcase from './components/PopoverShowcase';
import ScrollAreaShowcase from './components/ScrollAreaShowcase';
import SelectShowcase from './components/SelectShowcase';
import SliderShowcase from './components/SliderShowcase';
import SwitchShowcase from './components/SwitchShowcase';
import TabsShowcase from './components/TabsShowcase';
import ToastShowcase from './components/ToastShowcase';
import ToolButtonShowcase from './components/ToolButtonShowcase';
import ToolButtonListShowcase from './components/ToolButtonListShowcase';
import TooltipShowcase from './components/TooltipShowcase';

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
            {/* Navigation cards */}
            <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              <a
                href="/colors-and-type"
                className="focus:ring-primary block rounded-lg text-inherit no-underline hover:no-underline focus:outline-none focus:ring-2"
              >
                <Card className="hover:bg-primary/30 w-full transition-colors">
                  <CardHeader>
                    <CardTitle className="text-foreground text-xl">
                      <Icons.ColorChange className="h-12 w-12" />
                      Colors & Typography
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Color Palette and Typography Guidelines
                    </CardDescription>
                  </CardHeader>
                </Card>
              </a>
              <a
                href="/components-list"
                className="focus:ring-primary block rounded-lg text-inherit no-underline hover:no-underline focus:outline-none focus:ring-2"
              >
                <Card className="hover:bg-primary/30 w-full transition-colors">
                  <CardHeader>
                    <CardTitle className="text-foreground text-xl">
                      <Icons.ColorChange className="h-12 w-12" />
                      Components
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Essential UI Components with Variants
                    </CardDescription>
                  </CardHeader>
                </Card>
              </a>
              <a
                href="/patterns"
                className="focus:ring-primary block rounded-lg text-inherit no-underline hover:no-underline focus:outline-none focus:ring-2"
              >
                <Card className="hover:bg-primary/30 w-full transition-colors">
                  <CardHeader>
                    <CardTitle className="text-foreground text-xl">
                      <Icons.ColorChange className="h-12 w-12" />
                      Patterns
                    </CardTitle>
                    <CardDescription className="text-lg">
                      Component-Based Layout Examples
                    </CardDescription>
                  </CardHeader>
                </Card>
              </a>
            </div>

            <h1 className="text-foreground ml-6 mb-6 text-5xl">Components</h1>

            <AllinOneMenuShowcase />
            <ButtonShowcase />
            <CheckboxShowcase />
            <CinePlayerShowcase />
            <ComboboxShowcase />
            <DataRowShowcase />
            <DialogShowcase />
            <DropdownMenuShowcase />
            <HoverCardShowcase />
            <InputShowcase />
            <LabelShowcase />
            <NumericMetaShowcase />
            <PanelSectionShowcase />
            <PopoverShowcase />
            <ScrollAreaShowcase />
            <SelectShowcase />
            <SliderShowcase />
            <SwitchShowcase />
            <TabsShowcase />
            <ToastShowcase />
            <ToolButtonShowcase />
            <ToolButtonListShowcase />
            <TooltipShowcase />
          </div>
        </div>
      </TooltipProvider>
    </Layout>
  );
}
