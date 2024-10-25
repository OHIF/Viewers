import React, { useState } from 'react';
import '../css/custom.css';

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
    toast.success('Success heading', {
      description: 'This is a detailed description of the success message.',
    });
  };

  // Handler to trigger a toast with an action button
  const triggerActionButtonToast = () => {
    toast.info('Info heading', {
      description: 'This is an info message with an action button.',
      action: (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => alert('Action button clicked')}
        >
          Undo
        </Button>
      ),
    });
  };

  // Handler to trigger a toast with a cancel button
  const triggerCancelButtonToast = () => {
    toast.error('Error!', {
      description: 'This is an error message with a cancel button.',
      cancel: (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => toast.dismiss()}
        >
          Dismiss
        </Button>
      ),
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
    <div className="bg-background text-foreground h-full">
      <div className="mx-auto my-4 max-w-6xl py-6">
        <ShowcaseRow
          title="Buttons"
          description="Various button styles and sizes"
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
        </ShowcaseRow>

        <ShowcaseRow
          title="Small Buttons"
          description="Various small button styles"
          code={`
<Button variant="default" size="sm">Primary Button</Button>
<Button variant="secondary" size="sm">Secondary Button</Button>
<Button variant="ghost" size="sm">Ghost Button</Button>
<Button variant="ghost" size="icon">?</Button>
<Button variant="link" size="sm">Link</Button>
          `}
        >
          <div className="flex flex-wrap gap-4">
            <Button
              variant="default"
              size="sm"
            >
              Primary Button
            </Button>
            <Button
              variant="secondary"
              size="sm"
            >
              Secondary Button
            </Button>
            <Button
              variant="ghost"
              size="sm"
            >
              Ghost Button
            </Button>
            <Button
              variant="ghost"
              size="icon"
            >
              ?
            </Button>
            <Button
              variant="link"
              size="sm"
            >
              Link
            </Button>
          </div>
        </ShowcaseRow>

        <ShowcaseRow
          title="Button large"
          description="Various large button styles"
          code={`
<Button variant="default" size="lg">Primary Button</Button>
<Button variant="secondary" size="lg">Secondary Button</Button>
<Button variant="ghost" size="lg">Ghost Button</Button>
<Button variant="ghost" size="icon">?</Button>
<Button variant="link" size="lg">Link</Button>
          `}
        >
          <div className="flex flex-wrap gap-4">
            <Button
              variant="default"
              size="lg"
            >
              Primary Button
            </Button>
            <Button
              variant="secondary"
              size="lg"
            >
              Secondary Button
            </Button>
            <Button
              variant="ghost"
              size="lg"
            >
              Ghost Button
            </Button>
            <Button
              variant="ghost"
              size="icon"
            >
              ?
            </Button>
            <Button
              variant="link"
              size="lg"
            >
              Link
            </Button>
          </div>
        </ShowcaseRow>

        <ShowcaseRow
          title="Input"
          description="Input field with label"
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
          title="Color swatches"
          description="Various color swatches"
          code={`
<div className="bg-actions h-16 w-16 rounded"></div>
<div className="bg-infosecondary h-16 w-16 rounded"></div>
<div className="bg-highlight h-16 w-16 rounded"></div>
<div className="h-16 w-16 rounded bg-white"></div>
<div className="h-16 w-16 rounded bg-white"></div>
<div className="h-16 w-16 rounded bg-white"></div>
          `}
        >
          <div className="flex flex-wrap gap-4">
            <div className="bg-actions h-16 w-16 rounded"></div>
            <div className="bg-infosecondary h-16 w-16 rounded"></div>
            <div className="bg-highlight h-16 w-16 rounded"></div>
            <div className="h-16 w-16 rounded bg-white"></div>
            <div className="h-16 w-16 rounded bg-white"></div>
            <div className="h-16 w-16 rounded bg-white"></div>
          </div>
        </ShowcaseRow>

        <ShowcaseRow
          title="Slider"
          description="Adjustable slider component"
          code={`
<Slider defaultValue={[50]} max={100} step={1} />
          `}
        >
          <div className="w-full max-w-sm">
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
            />
          </div>
        </ShowcaseRow>

        <ShowcaseRow
          title="Typography"
          description="Various text sizes"
          code={`
<div className="text-base text-white">Standard text size (text-base) 14px</div>
<div className="text-sm text-white">Small text size (text-sm) 13px</div>
<div className="text-xs text-white">Extra small text size (text-xs) 12px</div>
          `}
        >
          <div className="flex flex-col gap-2">
            <div className="text-base text-white">Standard text size (text-base) 14px</div>
            <div className="text-sm text-white">Small text size (text-sm) 13px</div>
            <div className="text-xs text-white">Extra small text size (text-xs) 12px</div>
          </div>
        </ShowcaseRow>

        <ShowcaseRow
          title="Typography large"
          description="Various large text sizes"
          code={`
<div className="text-lg text-white">Large text size (text-lg) 16px</div>
<div className="text-xl text-white">Extra large text size (text-xl) 18px</div>
<div className="text-2xl text-white">Double extra large text size (text-2xl) 20px</div>
          `}
        >
          <div className="flex flex-col gap-2">
            <div className="text-lg text-white">Large text size (text-lg) 16px</div>
            <div className="text-xl text-white">Extra large text size (text-xl) 18px</div>
            <div className="text-2xl text-white">Double extra large text size (text-2xl) 20px</div>
          </div>
        </ShowcaseRow>

        <ShowcaseRow
          title="Tabs"
          description="Tabs component"
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
          title="Select"
          description="Select component"
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
          title="Dropdown Menu"
          description="Various dropdown menu examples"
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
                <DropdownMenuItem onSelect={() => console.debug('Item 1')}>Item 1</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => console.debug('Item 2')}>Item 2</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => console.debug('Item 3')}>
                  Long name Item 3
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ShowcaseRow>

        <ShowcaseRow
          title="Switch"
          description="Switch component"
          code={`
<Switch />
          `}
        >
          <Switch />
        </ShowcaseRow>

        <ShowcaseRow
          title="Checkbox"
          description="Checkbox with label"
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
          title="Toggle"
          description="Toggle component"
          code={`
<Toggle>Hello</Toggle>
          `}
        >
          <Toggle>Hello</Toggle>
        </ShowcaseRow>

        <ShowcaseRow
          title="Slider"
          description="Slider component"
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
          title="Scroll Area"
          description="Scroll Area component"
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
            mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
            do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </ScrollArea>
        </ShowcaseRow>
        <ShowcaseRow
          title="sonner 1"
          description="sonner1"
          code={`sdf`}
        >
          {/* Toast Examples Section */}
          <div className="space-x-2">
            <Button
              variant="default"
              onClick={triggerSuccess}
            >
              Show Success Toast
            </Button>
            <Button
              variant="default"
              onClick={triggerError}
            >
              Show Error Toast
            </Button>
            <Button
              variant="default"
              onClick={triggerInfo}
            >
              Show Info Toast
            </Button>
            <Button
              variant="default"
              onClick={triggerWarning}
            >
              Show Warning Toast
            </Button>
            <Button
              variant="default"
              onClick={triggerPromiseToast}
            >
              Loading & Success Toast
            </Button>
          </div>
        </ShowcaseRow>

        <ShowcaseRow
          title="sonner 2"
          description="sonner2"
          code={`sdf`}
        >
          <Button
            variant="default"
            onClick={triggerDescriptionToast}
          >
            Show Toast with Description
          </Button>

          <Button
            variant="default"
            onClick={triggerActionButtonToast}
          >
            Show Toast with Action Button
          </Button>

          <Button
            variant="default"
            onClick={triggerCancelButtonToast}
          >
            Show Toast with Cancel Button
          </Button>

          <Button
            variant="default"
            onClick={triggerCombinedToast}
          >
            Show Toast with Action & Cancel Buttons
          </Button>

          {/* Render the Toaster component */}
          <Toaster />
        </ShowcaseRow>
      </div>
    </div>
  );
}

function ShowcaseRow({ title, description, children, code }: ShowcaseRowProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="bg-secondary/10 mb-8 rounded-lg p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCode(!showCode)}
        >
          {showCode ? 'Hide Code' : 'Show Code'} <Icons.Code className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="showcase-content mb-4">{children}</div>
      {showCode && (
        <pre className="mt-4 overflow-x-auto rounded-md bg-black p-4 text-sm">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
