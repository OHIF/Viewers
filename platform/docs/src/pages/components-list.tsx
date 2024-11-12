import React, { useState } from 'react';
import '../css/custom.css';

import Layout from '@theme/Layout';
import { Label } from '../../../ui-next/src/components/Label';
import { Input } from '../../../ui-next/src/components/Input';
import { Separator } from '../../../ui-next/src/components/Separator';
import { Tabs, TabsList, TabsTrigger } from '../../../ui-next/src/components/Tabs';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../../../ui-next/src/components/Select';
import { Button } from '../../../ui-next/src/components/Button';
import { Switch } from '../../../ui-next/src/components/Switch';
import { Checkbox } from '../../../ui-next/src/components/Checkbox';
import { Toggle } from '../../../ui-next/src/components/Toggle';
import { Slider } from '../../../ui-next/src/components/Slider';
import { ScrollArea } from '../../../ui-next/src/components/ScrollArea';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../../ui-next/src/components/DropdownMenu';
import { Icons } from '../../../ui-next/src/components/Icons';
import { Toaster, toast } from '../../../ui-next/src/components/Sonner';
import { DataRow } from '../../../ui-next/src/components/DataRow';
import DataRowExample from './patterns/DataRowExample';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../ui-next/src/components/Card';

interface ShowcaseRowProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  code: string;
}

export default function ComponentShowcase() {
  // Handlers to trigger different types of toasts
  const triggerSuccess = () => {
    toast.success('This is a success toast!');
  };

  const triggerError = () => {
    toast.error('This is an error toast!');
  };

  const triggerInfo = () => {
    toast.info('This is an info toast!');
  };

  const triggerWarning = () => {
    toast.warning('This is a warning toast!');
  };

  // Handler to trigger a toast.promise example
  const triggerPromiseToast = () => {
    const promise = () =>
      new Promise<{ name: string }>(resolve =>
        setTimeout(() => resolve({ name: 'Segmentation 1' }), 3000)
      );

    toast.promise(promise(), {
      loading: 'Loading Segmentation...',
      success: data => `${data.name} has been added`,
      error: 'Error',
    });
  };

  // Handler to trigger a toast with description
  const triggerDescriptionToast = () => {
    toast.success('Completed', {
      description: 'This is a detailed description of the success message.',
    });
  };

  // Handler to trigger a toast with an action button
  const triggerActionButtonToast = () => {
    toast.info('No active segmentation detected', {
      description: 'Create a segmentation before using the Brush',
    });
  };

  // Handler to trigger a toast with a cancel button
  const triggerCancelButtonToast = () => {
    toast.error('No active segmentation detected', {
      description: 'Create a segmentation before using the Brush',
    });
  };

  // Handler to trigger a toast with both action and cancel buttons
  const triggerCombinedToast = () => {
    toast.warning('Warning!', {
      description: 'This is a warning with both action and cancel buttons.',
      action: (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => alert('Retry action clicked')}
        >
          Retry
        </Button>
      ),
      cancel: (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => toast.dismiss()}
        >
          Cancel
        </Button>
      ),
    });
  };

  // Handler to trigger a loading toast using Toaster's default loading icon
  const showLoadingToast = () => {
    toast.loading('Loading your data...');
  };

  return (
    <Layout
      title="Components"
      description="OHIF Viewer Components"
    >
      <div className="text-foreground min-h-screen bg-black">
        <div className="mx-auto my-4 max-w-5xl pt-6 pb-3">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
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
                  <CardDescription className="text-base">
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
                  <CardDescription className="text-base">
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
                  <CardDescription className="text-base">
                    Component-Based Layout Examples
                  </CardDescription>
                </CardHeader>
              </Card>
            </a>
          </div>
        </div>

        <div className="mx-auto my-4 max-w-5xl pt-4 pb-6">
          <div className="ml-6 mb-6 text-base">
            <h1 className="text-foreground mb-3 text-5xl">Components</h1>
          </div>

          {/* Alphabetically Sorted ShowcaseRows */}
          <ShowcaseRow
            title="Buttons"
            description="Button components and size variants. Use the primary and secondary buttons in dialogs or screens where one action is required. In the Viewer application, use ghost button in panels where many different actions are available."
            code={`
<Button variant="default">Primary Button</Button>

<Button variant="secondary">Secondary Button</Button>

<Button variant="ghost">Ghost Button</Button>

<Button variant="ghost" size="icon">?</Button>

<Button variant="link">Link</Button>
            `}
          >
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button
                variant="ghost"
                size="icon"
              >
                ?
              </Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <Button
                variant="default"
                size="lg"
                className="w-[107px]"
              >
                Large Button
              </Button>
              <Button
                variant="default"
                size="sm"
              >
                Small Button
              </Button>
            </div>
          </ShowcaseRow>

          <ShowcaseRow
            title="Checkbox"
            description="When possible use Switch in place of checkbox. If necessary, Checkbox provides a smaller component to change between two states or options."
            code={`
<div className="items-top flex space-x-2">
  <Checkbox id="terms1" />
  <div className="grid gap-1.5 pt-0.5 leading-none">
    <Label>Display inactive segmentations</Label>
  </div>
</div>
            `}
          >
            <div className="items-top flex space-x-2">
              <Checkbox id="terms1" />
              <div className="grid gap-1.5 pt-0.5 leading-none">
                <Label>Display inactive segmentations</Label>
              </div>
            </div>
          </ShowcaseRow>

          <ShowcaseRow
            title="Data Row"
            description="A selectable row with action menu options and visibility toggle. Color, Secondary details, and Image Series are optional to display."
            code={`
Example code coming soon.
            `}
          >
            {/* Render the DataRowExample component */}
            <DataRowExample />
          </ShowcaseRow>

          <ShowcaseRow
            title="Dropdown Menu"
            description="Dropdown menu provides a flexible list of options that can open from buttons or other elements"
            code={`
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button>Open Basic</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
    <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open Align Start</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
    <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open Align End</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
    <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open Align Top</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent side="top" align="start">
    <DropdownMenuItem onSelect={() => console.debug('Item 1')}>Item 1</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => console.debug('Item 2')}>Item 2</DropdownMenuItem>
    <DropdownMenuItem onSelect={() => console.debug('Item 3')}>Long name Item 3</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
            `}
          >
            <div className="flex flex-wrap gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button>Open Basic</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Item 1</DropdownMenuItem>
                  <DropdownMenuItem>Item 2</DropdownMenuItem>
                  <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>Open Align Start</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Item 1</DropdownMenuItem>
                  <DropdownMenuItem>Item 2</DropdownMenuItem>
                  <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>Open Align End</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Item 1</DropdownMenuItem>
                  <DropdownMenuItem>Item 2</DropdownMenuItem>
                  <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>Open Align Top</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                >
                  <DropdownMenuItem onSelect={() => console.debug('Item 1')}>
                    Item 1
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => console.debug('Item 2')}>
                    Item 2
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => console.debug('Item 3')}>
                    Long name Item 3
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </ShowcaseRow>

          <ShowcaseRow
            title="Input"
            description="Input fields can be used with or without example text"
            code={`
<div className="inline-block">
  <div className="mr-4 inline-block">
    <Label>Patient Weight</Label>
  </div>
  <div className="inline-block">
    <Input placeholder="(kg)" />
  </div>
</div>
            `}
          >
            <div className="inline-block">
              <div className="mr-4 inline-block">
                <Label>Patient Weight</Label>
              </div>
              <div className="inline-block">
                <Input placeholder="(kg)" />
              </div>
            </div>
          </ShowcaseRow>

          <ShowcaseRow
            title="Scroll Area"
            description="Displays a scroll indicator when hovering within an element."
            code={`
<ScrollArea className="border-input bg-background h-[150px] w-[350px] rounded-md border p-2 text-sm text-white">
  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
  laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
  non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
  magna aliqua.
</ScrollArea>
            `}
          >
            <ScrollArea className="border-input bg-background h-[150px] w-[350px] rounded-md border p-2 text-sm text-white">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
              dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
              mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit,
              sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </ScrollArea>
          </ShowcaseRow>

          <ShowcaseRow
            title="Select"
            description="Switch between a list of options"
            code={`
<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Theme" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="light">Light</SelectItem>
    <SelectItem value="dark">Dark</SelectItem>
    <SelectItem value="system">System</SelectItem>
  </SelectContent>
</Select>
            `}
          >
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </ShowcaseRow>

          <ShowcaseRow
            title="Slider"
            description="Used to select a value in a predefined range."
            code={`
<div className="w-40 px-5">
  <Slider
    className="w-full"
    defaultValue={[50]}
    max={100}
    step={1}
  />
</div>
            `}
          >
            <div className="w-40 px-5">
              <Slider
                className="w-full"
                defaultValue={[50]}
                max={100}
                step={1}
              />
            </div>
          </ShowcaseRow>

          <ShowcaseRow
            title="Switch"
            description="A toggle Switch is used to change between two different states. Use descriptive labels next to Switches that are understandable before interacting."
            code={`
<Switch />
            `}
          >
            <Switch defaultChecked />
            <Label className="text-foreground mx-2 w-14 flex-none whitespace-nowrap text-sm">
              Sync changes in all viewports
            </Label>
          </ShowcaseRow>

          <ShowcaseRow
            title="Tabs"
            description="Tabs (or segmented controls) can be used to provide navigation options or allow users to switch between multiple options (e.g., tool settings) "
            code={`
<Tabs className="w-[400px]">
  <TabsList>
    <TabsTrigger value="circle">Circle</TabsTrigger>
    <Separator orientation="vertical" />
    <TabsTrigger value="sphere">Sphere</TabsTrigger>
    <Separator orientation="vertical" />
    <TabsTrigger value="square">Square</TabsTrigger>
  </TabsList>
</Tabs>
            `}
          >
            <Tabs className="w-[400px]">
              <TabsList>
                <TabsTrigger value="circle">Circle</TabsTrigger>
                <Separator orientation="vertical" />
                <TabsTrigger value="sphere">Sphere</TabsTrigger>
                <Separator orientation="vertical" />
                <TabsTrigger value="square">Square</TabsTrigger>
              </TabsList>
            </Tabs>
          </ShowcaseRow>

          <ShowcaseRow
            title="Toast"
            description="A toast notification displays temporary feedback messages to users above the current UI. Notifications stack into one unit after multiple cascading notifications."
            code={`
Example code coming soon.

              `}
          >
            {/* Toast Examples Section */}
            Simple message:
            <div className="mt-2 mb-7 space-x-2">
              <Button
                variant="default"
                onClick={triggerPromiseToast}
              >
                Loading & Success Toast
              </Button>
              <Button
                variant="default"
                onClick={triggerSuccess}
              >
                Success Toast
              </Button>
              <Button
                variant="default"
                onClick={triggerError}
              >
                Error Toast
              </Button>
              <Button
                variant="default"
                onClick={triggerInfo}
              >
                Info Toast
              </Button>
              <Button
                variant="default"
                onClick={triggerWarning}
              >
                Warning Toast
              </Button>
            </div>
            Message with details:
            <div className="mt-2 space-x-2">
              <Button
                variant="default"
                onClick={triggerDescriptionToast}
              >
                Success Toast
              </Button>
              <Button
                variant="default"
                onClick={triggerActionButtonToast}
              >
                Info Toast
              </Button>
              <Button
                variant="default"
                onClick={triggerCancelButtonToast}
              >
                Error Toast
              </Button>
              <Button
                variant="default"
                onClick={triggerCombinedToast}
              >
                Toast with Buttons
              </Button>
            </div>
            {/* Render the Toaster component */}
            <Toaster />
          </ShowcaseRow>
        </div>
      </div>
    </Layout>
  );
}

function ShowcaseRow({ title, description, children, code }: ShowcaseRowProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="bg-background mb-8 rounded-lg p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-highlight text-2xl">{title}</h2>
        </div>
        <Button
          className="text-primary"
          variant="ghost"
          size="sm"
          onClick={() => setShowCode(!showCode)}
        >
          {showCode ? 'Hide Code' : 'Show Code'} <Icons.Code className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-9 md:grid-cols-3">
        <div className="text-base md:col-span-1">
          {description && <p className="text-secondary-foreground mt-2">{description}</p>}
        </div>
        <div className="flex min-h-[120px] items-center md:col-span-2">
          <div className="showcase-content">{children}</div>
        </div>
      </div>
      {showCode && (
        <pre className="border-input mt-4 overflow-x-auto rounded-md border bg-black p-4 text-sm">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

// function ShowcaseRow({ title, description, children, code }: ShowcaseRowProps) {
//   const [showCode, setShowCode] = useState(false);

//   return (
//     <div className="bg-background mb-8 rounded-lg p-6">
//       <div className="mb-4 flex items-start justify-between">
//         <div>
//           <h2 className="text-2xl font-bold">{title}</h2>
//           {description && <p className="text-muted-foreground mt-1">{description}</p>}
//         </div>
//         <Button
//           className="text-primary"
//           variant="outline"
//           size="sm"
//           onClick={() => setShowCode(!showCode)}
//         >
//           {showCode ? 'Hide Code' : 'Show Code'} <Icons.Code className="ml-2 h-4 w-4" />
//         </Button>
//       </div>
//       <div className="showcase-content mb-4">{children}</div>
//       {showCode && (
//         <pre className="mt-4 overflow-x-auto rounded-md bg-black p-4 text-sm">
//           <code>{code}</code>
//         </pre>
//       )}
//     </div>
//   );
// }
