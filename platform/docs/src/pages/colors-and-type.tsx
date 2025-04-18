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

          <h1 className="text-foreground ml-6 mb-6 text-5xl">Colors & Typography</h1>

          <ShowcaseRow
            title="Colors"
            description="Updated color variables for new components."
            code={`Code Example Coming Soon`}
          >
            <div className="mb-6 grid grid-cols-[28%,1fr] items-start gap-x-8">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3">
                  <div className="bg-highlight h-[30px] w-[30px] rounded"></div>
                  <span className="text-foreground text-lg">highlight</span>
                </div>
                <div className="flex items-center space-x-3"></div>
              </div>
              <div className="text-secondary-foreground flex items-center pt-1.5 text-lg">
                Used for active or selected elements in the Viewer.
              </div>
            </div>

            <div className="mb-6 grid grid-cols-[28%,1fr] items-start gap-x-8">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary h-[30px] w-[30px] rounded"></div>
                  <span className="text-foreground text-lg">primary</span>
                </div>
                <div className="flex items-center space-x-3"></div>
              </div>
              <div className="text-secondary-foreground flex items-center pt-1.5 text-lg">
                Used for Actions. Icons use 'primary' at 100% opacity while various components will
                use a reduced opacity. Hover and other states increase the opacity.
              </div>
            </div>

            <div className="mb-8 grid grid-cols-[28%,1fr] items-start gap-x-8">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3">
                  <div className="bg-popover h-[30px] w-[30px] rounded"></div>
                  <span className="text-foreground text-lg">popover</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-muted h-[30px] w-[30px] rounded"></div>
                  <span className="text-foreground text-lg">muted</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-background border-input h-[30px] w-[30px] rounded border"></div>
                  <span className="text-foreground text-lg">background</span>
                </div>
              </div>
              <div className="text-secondary-foreground flex items-center pt-1.5 text-lg">
                These three colors are used as background colors. For the lowest level above black
                use 'background'. For normal panel backgrounds and other interactive components, use
                'muted'. For elements such as menus and popovers, use 'popover'.
              </div>
            </div>

            <div className="mb-8 grid grid-cols-[28%,1fr] items-start gap-x-8">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3">
                  <div className="bg-foreground h-[30px] w-[30px] rounded"></div>
                  <span className="text-foreground text-lg">foreground</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-muted-foreground h-[30px] w-[30px] rounded"></div>
                  <span className="text-foreground text-lg">muted-foreground</span>
                </div>
              </div>
              <div className="text-secondary-foreground flex items-center pt-1.5 text-lg">
                For primary and important text, use 'foreground'. When secondary text is available,
                use 'muted-foreground' to create separation and readability.
              </div>
            </div>

            <div className="mb-8 grid grid-cols-[28%,1fr] items-start gap-x-8">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3">
                  <div className="bg-input h-[30px] w-[30px] rounded"></div>
                  <span className="text-foreground text-lg">input</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-neutral h-[30px] w-[30px] rounded"></div>
                  <span className="text-foreground text-lg">neutral</span>
                </div>
              </div>
              <div className="text-secondary-foreground flex items-center pt-1.5 text-lg">
                Used for borders and UI elements. 'neutral' is typically used at 50% opacity for
                elements such as scrollbars and will work over light and dark backgrounds
              </div>
            </div>
          </ShowcaseRow>

          <ShowcaseRow
            title="Typography"
            description="Type variables and guidelines"
            code={`
Code example coming soon
          `}
          >
            <div className="mb-6 grid grid-cols-[28%,1fr] items-start gap-x-8">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3 text-base">
                  <span className="text-foreground">text-base</span>
                  <span className="text-muted-foreground">13px</span>
                </div>
                <div className="flex items-center space-x-3"></div>
              </div>
              <div className="text-secondary-foreground flex items-center pt-0 text-lg">
                text-base is used as the base font size of the Viewer interface. Use when putting
                text in panels or other interface elements next to medical images.
              </div>
            </div>

            <div className="mb-6 grid grid-cols-[28%,1fr] items-start gap-x-8">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3 text-lg">
                  <span className="text-foreground">text-lg</span>
                  <span className="text-muted-foreground">14px</span>
                </div>
                <div className="flex items-center space-x-3"></div>
              </div>
              <div className="text-secondary-foreground flex items-center pt-0 text-lg">
                text-lg can be used for dialog text or important messaging text within the Viewer.
                Use this font size for easier reading on other standard text pages.
              </div>
            </div>

            <div className="mb-6 grid grid-cols-[28%,1fr] items-start gap-x-8">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3 text-xl">
                  <span className="text-foreground">text-xl</span>
                  <span className="text-muted-foreground">16px</span>
                </div>
                <div className="flex items-center space-x-3"></div>
              </div>
              <div className="text-secondary-foreground flex items-center pt-0 text-lg">
                text-xl can be used as headings within dialogs or messaging.
              </div>
            </div>

            <div className="mb-6 grid grid-cols-[28%,1fr] items-start gap-x-8">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3 text-2xl">
                  <span className="text-foreground">text-2xl</span>
                  <span className="text-muted-foreground">18px</span>
                </div>
                <div className="flex items-center space-x-3"></div>
              </div>
              <div className="text-secondary-foreground flex items-center pt-0 text-lg">
                text-2xl can be used for page headers in the Viewer application or as dialog titles.
              </div>
            </div>

            <div className="mb-6 grid grid-cols-[28%,1fr] items-start gap-x-8">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3 text-3xl">
                  <span className="text-foreground">text-3xl</span>
                  <span className="text-muted-foreground">20px</span>
                </div>
                <div className="flex items-center space-x-3"></div>
              </div>
              <div className="text-secondary-foreground flex items-center pt-0 text-lg">
                text-3xl can be used for extra large text size in the application.
              </div>
            </div>

            <div className="mb-6 grid grid-cols-[28%,1fr] items-start gap-x-8">
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-foreground">text-sm</span>
                  <span className="text-muted-foreground">12px</span>
                </div>
                <div className="flex items-center space-x-3"></div>
              </div>
              <div className="text-secondary-foreground flex items-center pt-0 text-lg">
                text-sm can be used for details that do not need to be standard sizes in the Viewer.
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
        <div className="text-lg md:col-span-1">
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
//           {description && <p className="text-secondary-foreground mt-1">{description}</p>}
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
