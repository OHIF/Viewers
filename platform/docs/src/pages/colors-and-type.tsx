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
    toast.success('Success heading', {
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
      title="Colors and Typography"
      description="Colors and Typography"
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
          <h1 className="text-foreground ml-6 mb-6 text-5xl">Colors & Typography</h1>

          <ShowcaseRow
            title="Colors"
            description="Updated color variables for new components."
            code={`sdf`}
          >
            <div className="grid grid-cols-2 items-start gap-x-4 gap-y-1">
              <div className="mb-3 flex items-center space-x-3">
                <div className="bg-highlight h-[30px] w-[30px] rounded"></div>
                <span className="text-foreground text-md">highlight</span>
              </div>
              <div className="flex items-center space-x-2"></div>
              <div className="mb-3 flex items-center space-x-3">
                <div className="bg-primary h-[30px] w-[30px] rounded"></div>
                <span className="text-foreground text-md">primary</span>
              </div>
              <div className="flex items-center space-x-2"></div>
              <div className="mb-3 flex items-center space-x-3">
                <div className="bg-background border-input h-[30px] w-[30px] rounded border"></div>
                <span className="text-foreground text-md">background</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-foreground h-[30px] w-[30px] rounded"></div>
                <span className="text-foreground text-md">foreground</span>
              </div>
              <div className="mb-3 flex items-center space-x-3">
                <div className="bg-muted h-[30px] w-[30px] rounded"></div>
                <span className="text-foreground text-md">muted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-muted-foreground h-[30px] w-[30px] rounded"></div>
                <span className="text-foreground text-md">muted-foreground</span>
              </div>
              <div className="mb-3 flex items-center space-x-3">
                <div className="bg-popover h-[30px] w-[30px] rounded"></div>
                <span className="text-foreground text-md">popover</span>
              </div>
              <div className="flex items-center space-x-2"></div>
            </div>
          </ShowcaseRow>

          <ShowcaseRow
            title="Typography"
            description="Type variables and guidelines"
            code={`
<div className="text-base text-white">Standard text size (text-base) 14px</div>
<div className="text-sm text-white">Small text size (text-sm) 13px</div>
<div className="text-xs text-white">Extra small text size (text-xs) 12px</div>
<div className="text-lg text-white">Large text size (text-lg) 16px</div>
<div className="text-xl text-white">Extra large text size (text-xl) 18px</div>
<div className="text-2xl text-white">Double extra large text size (text-2xl) 20px</div>
          `}
          >
            <div className="flex flex-col gap-2">
              <div className="text-xs text-white">
                text-xs: <span className="text-muted-foreground">12px</span> Small text used for
                small descriptions or notes
              </div>
              <div className="text-sm text-white">
                text-sm: <span className="text-muted-foreground">13px</span> Standard text size in
                panels and application information
              </div>
              <div className="text-base text-white">
                text-base: <span className="text-muted-foreground">14px</span> Standard text size
                used in dialogs or other pages
              </div>
              <div className="text-lg text-white">
                text-lg: <span className="text-muted-foreground">16px</span> Large text size
              </div>
              <div className="text-xl text-white">
                text-xl: <span className="text-muted-foreground">18px</span> Extra large text size
              </div>
              <div className="text-2xl text-white">
                text-2xl: <span className="text-muted-foreground">20px</span> Double extra large
                text size
              </div>
            </div>
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
