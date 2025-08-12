import React from 'react';
import '../css/custom.css';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

/**
 * Components List page that displays all available UI components
 */
export default function ComponentsList() {
  return (
    <Layout title="Components" description="OHIF Viewer Components">
      <BrowserOnly fallback={<></>}>
        {() => {
          // Dynamically require all sub-components to avoid SSR issues
          const { TooltipProvider } =
            require('../../../ui-next/src/components/Tooltip');

          const {
            Card,
            CardHeader,
            CardTitle,
            CardDescription,
          } = require('../../../ui-next/src/components/Card');
          const { Icons } = require('../../../ui-next/src/components/Icons');

          // Showcase modules
          const AllinOneMenuShowcase = require('./components/AllinOneMenuShowcase').default;
          const ButtonShowcase = require('./components/ButtonShowcase').default;
          const CheckboxShowcase = require('./components/CheckboxShowcase').default;
          const CinePlayerShowcase = require('./components/CinePlayerShowcase').default;
          const ComboboxShowcase = require('./components/ComboboxShowcase').default;
          const DataRowShowcase = require('./components/DataRowShowcase').default;
          const DialogShowcase = require('./components/DialogShowcase').default;
          const DropdownMenuShowcase = require('./components/DropdownMenuShowcase').default;
          const HoverCardShowcase = require('./components/HoverCardShowcase').default;
          const InputShowcase = require('./components/InputShowcase').default;
          const LabelShowcase = require('./components/LabelShowcase').default;
          const NumericMetaShowcase = require('./components/NumericMetaShowcase').default;
          const PanelSectionShowcase = require('./components/PanelSectionShowcase').default;
          const PopoverShowcase = require('./components/PopoverShowcase').default;
          const ScrollAreaShowcase = require('./components/ScrollAreaShowcase').default;
          const SelectShowcase = require('./components/SelectShowcase').default;
          const SliderShowcase = require('./components/SliderShowcase').default;
          const SwitchShowcase = require('./components/SwitchShowcase').default;
          const TabsShowcase = require('./components/TabsShowcase').default;
          const ToastShowcase = require('./components/ToastShowcase').default;
          const ToolButtonShowcase = require('./components/ToolButtonShowcase').default;
          const ToolButtonListShowcase = require('./components/ToolButtonListShowcase').default;
          const TooltipShowcase = require('./components/TooltipShowcase').default;

          return (
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
                            Colors &amp; Typography
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
                            Component‑Based Layout Examples
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </a>
                  </div>

                  <h1 className="text-foreground ml-6 mb-6 text-5xl">
                    Components
                  </h1>

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
          );
        }}
      </BrowserOnly>
    </Layout>
  );
}
