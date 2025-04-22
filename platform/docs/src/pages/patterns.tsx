import React, { useState } from 'react';
import '../css/custom.css';

import Layout from '@theme/Layout';
import { Button } from '../../../ui-next/src/components/Button';
import { Icons } from '../../../ui-next/src/components/Icons';
import { Card, CardHeader, CardTitle, CardDescription } from '../../../ui-next/src/components/Card';

interface ShowcaseRowProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  code: string;
}

export default function ComponentShowcase() {
  // Update function to handle paths correctly
  const openLinkInNewWindow = (url: string) => {
    // Remove leading dot if present to fix production paths
    const cleanUrl = url.startsWith('.') ? url.substring(1) : url;
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout
      title="Patterns"
      description="Patterns and example layouts"
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
                  onClick={() => openLinkInNewWindow('/patterns/patterns-segmentation')}
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
                  onClick={() => openLinkInNewWindow('/patterns/patterns-measurements')}
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
