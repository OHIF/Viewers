// src/_pages/playground.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Label } from '../components/Label';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from '../components/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/Tabs';
import { Separator } from '../components/Separator';
import { Switch } from '../components/Switch';
import { Checkbox } from '../components/Checkbox';
import { Toggle, toggleVariants } from '../components/Toggle';
import { Slider } from '../components/Slider';
import { ScrollArea, ScrollBar } from '../components/ScrollArea';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from '../components/DropdownMenu';
import { Toaster, toast } from '../components/Sonner';
import { Icons } from '../components/Icons';

import { BackgroundColorSelect } from '../components/BackgroundColorSelect';

export default function Playground() {
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
    <main className="my-4 mx-auto max-w-6xl py-6">
      <BackgroundColorSelect />

      <h2 className="section-header">Button default</h2>
      <div className="row">
        <div className="example">
          <Button variant="default">Primary Button</Button>
        </div>
        <div className="example">
          <Button variant="secondary">Secondary Button</Button>
        </div>
        <div className="example">
          <Button variant="ghost">Ghost Button</Button>
        </div>
        <div className="example">
          <Button
            variant="ghost"
            size="icon"
          >
            ?
          </Button>
        </div>
        <div className="example">
          <Button variant="link">Link</Button>
        </div>
      </div>

      <h2 className="section-header">Button small</h2>
      <div className="row">
        <div className="example">
          <Button
            variant="default"
            size="sm"
          >
            Primary Button
          </Button>
        </div>
        <div className="example">
          <Button
            variant="secondary"
            size="sm"
          >
            Secondary Button
          </Button>
        </div>
        <div className="example">
          <Button
            variant="ghost"
            size="sm"
          >
            Ghost Button
          </Button>
        </div>
        <div className="example">
          <Button
            variant="ghost"
            size="icon"
          >
            ?
          </Button>
        </div>
        <div className="example">
          <Button
            variant="link"
            size="sm"
          >
            Link
          </Button>
        </div>
      </div>

      <h2 className="section-header">Button large</h2>
      <div className="row">
        <div className="example">
          <Button
            variant="default"
            size="lg"
          >
            Primary Button
          </Button>
        </div>
        <div className="example">
          <Button
            variant="secondary"
            size="lg"
          >
            Secondary Button
          </Button>
        </div>
        <div className="example">
          <Button
            variant="ghost"
            size="lg"
          >
            Ghost Button
          </Button>
        </div>
        <div className="example">
          <Button
            variant="ghost"
            size="icon"
          >
            ?
          </Button>
        </div>
        <div className="example">
          <Button
            variant="link"
            size="lg"
          >
            Link
          </Button>
        </div>
      </div>

      <h2 className="section-header">Input</h2>
      <div className="row">
        <div className="example">
          <div className="inline-block">
            <div className="mr-4 inline-block">
              <Label>Patient Weight</Label>
            </div>
            <div className="inline-block">
              <Input placeholder="(kg)" />
            </div>
          </div>
        </div>
      </div>

      <h2 className="section-header">Color swatches</h2>
      <div className="row">
        <div className="example2">
          <div className="bg-actions h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-infosecondary h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="bg-highlight h-16 w-16 rounded"></div>
        </div>
        <div className="example2">
          <div className="h-16 w-16 rounded bg-white"></div>
        </div>
        <div className="example2">
          <div className="h-16 w-16 rounded bg-white"></div>
        </div>
        <div className="example2">
          <div className="h-16 w-16 rounded bg-white"></div>
        </div>
      </div>

      <h2 className="section-header">Typography</h2>
      <div className="row">
        <div className="example text-base text-white">Standard text size (text-base) 14px</div>
        <div className="example text-sm text-white">Small text size (text-sm) 13px</div>
        <div className="example text-xs text-white">Extra small text size (text-xs) 12px</div>
      </div>

      <h2 className="section-header">Typography large</h2>
      <div className="row">
        <div className="example text-lg text-white">Large text size (text-lg) 16px</div>
        <div className="example text-xl text-white">Small text size (text-xl) 18px</div>
        <div className="example text-2xl text-white">Extra small text size (text-2xl) 20px</div>
      </div>

      <h2 className="section-header">Tabs</h2>
      <div className="row">
        <div className="example">
          <Tabs className="w-[400px]">
            <TabsList>
              <TabsTrigger value="circle">Circle</TabsTrigger>
              <Separator orientation="vertical" />
              <TabsTrigger value="sphere">Sphere</TabsTrigger>
              <Separator orientation="vertical" />
              <TabsTrigger value="square">Square</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <h2 className="section-header">Select</h2>
      <div className="row">
        <div className="example">
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
        </div>
      </div>

      <h2 className="section-header">Dropdown Menu</h2>
      <div className="row">
        <div className="example">
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
        </div>
        <div className="example">
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
        </div>
        <div className="example">
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
        </div>
        <div className="example">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Open Align Top</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
            >
              <DropdownMenuItem onSelect={() => console.log('Item 1')}>Item 1</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => console.log('Item 2')}>Item 2</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => console.log('Item 3')}>
                Long name Item 3
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <h2 className="section-header">Switch</h2>
      <div className="row">
        <div className="example">
          <Switch />
        </div>
      </div>

      <h2 className="section-header">Checkbox</h2>
      <div className="row">
        <div className="example">
          <div className="items-top flex space-x-2">
            <Checkbox id="terms1" />
            <div className="grid gap-1.5 pt-0.5 leading-none">
              <Label>Display inactive segmentations</Label>
            </div>
          </div>
        </div>
      </div>

      <h2 className="section-header">Toggle</h2>
      <div className="row">
        <div className="example">
          <Toggle>Hello</Toggle>
        </div>
      </div>

      <h2 className="section-header">Slider</h2>
      <div className="row">
        <div className="example">
          <div className="w-40 px-5">
            <Slider
              className="w-full"
              defaultValue={[50]}
              max={100}
              step={1}
            />
          </div>
        </div>
      </div>

      <h2 className="section-header">Accordion</h2>
      <div className="row">
        <div className="example">
          <div className="w-40 px-5">
            <Slider
              className="w-full"
              defaultValue={[50]}
              max={100}
              step={1}
            />
          </div>
        </div>
      </div>

      <h2 className="section-header">Scroll Area</h2>
      <div className="row">
        <div className="example">
          <ScrollArea className="border-input bg-background h-[150px] w-[350px] rounded-md border p-2 text-sm text-white">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
            dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
            mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
            do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </ScrollArea>
        </div>
      </div>

      {/* Toast Examples Section */}
      <h2 className="section-header">Toast (Sonner)</h2>
      <div className="row space-y-4">
        <Button
          variant="default"
          onClick={triggerSuccess}
        >
          Show Success Toast
        </Button>
        <Button
          variant="secondary"
          onClick={triggerError}
        >
          Show Error Toast
        </Button>
        <Button
          variant="ghost"
          onClick={triggerInfo}
        >
          Show Info Toast
        </Button>
        <Button
          variant="link"
          onClick={triggerWarning}
        >
          Show Warning Toast
        </Button>
        <Button
          variant="default"
          onClick={triggerPromiseToast}
        >
          Start Async Operation
        </Button>
      </div>

      {/* Additional Toast Examples Section */}
      <h2 className="section-header">Additional Toast Examples</h2>
      <div className="row space-y-4">
        <Button
          variant="default"
          onClick={triggerDescriptionToast}
        >
          Show Toast with Description
        </Button>
        <Button
          variant="secondary"
          onClick={triggerActionButtonToast}
        >
          Show Toast with Action Button
        </Button>
        <Button
          variant="ghost"
          onClick={triggerCancelButtonToast}
        >
          Show Toast with Cancel Button
        </Button>
        <Button
          variant="link"
          onClick={triggerCombinedToast}
        >
          Show Toast with Action & Cancel Buttons
        </Button>
      </div>

      {/* Render the Toaster component */}
      <Toaster />
    </main>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Playground />);
