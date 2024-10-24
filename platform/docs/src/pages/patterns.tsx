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
  // Function to open links in a new window
  const openLinkInNewWindow = url => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
      title="Patterns"
      description="Patterns and example layouts"
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
          <h1 className="text-foreground ml-6 mb-6 text-5xl">Patterns</h1>

          <ShowcaseRow
            title="Segmentation List"
            description={
              <div className="space-y-4">
                <div className="block">
                  Uses the Data Row component to displays a list of segments. The current
                  "Segmentation" is chosen with a Select above the current list.
                </div>
                <Button
                  variant="default"
                  onClick={() => openLinkInNewWindow('./patterns/patterns-segmentation')}
                >
                  Launch Segmentation Example
                </Button>
              </div>
            }
            code={`
aaa
          `}
          >
            <div className="flex flex-wrap gap-4"></div>
            <div className="mt-6 mb-5 flex flex-wrap gap-4">
              <img
                src="/img/patterns-segmentation.png"
                alt="Segmentation Panel"
                width={274}
              ></img>
            </div>
          </ShowcaseRow>

          <ShowcaseRow
            title="Measurement List"
            description={
              <div className="space-y-4">
                <div className="block">
                  Uses the Data Row component to displays a list of measurements. A custom "Label"
                  starts each row with measurement data appearing on the secondary row
                </div>
                <Button
                  variant="default"
                  onClick={() => openLinkInNewWindow('./patterns/patterns-measurements')}
                >
                  Launch Measurements Example
                </Button>
              </div>
            }
            code={`
aaa
          `}
          >
            <div className="flex flex-wrap gap-4"></div>
            <div className="mt-6 flex flex-wrap gap-4">
              <img
                src="/img/patterns-measurements.png"
                alt="Measurements Panel"
                width={274}
              ></img>
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
        ></Button>
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
