import React from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';

import { Button } from '../components/Button';
// import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../components/Tooltip';

// import type { Metadata } from 'next';
// import Script from 'next/script';
// import BackgroundColorSelector from '@/components/backgroundcolor';
// import { useState, useEffect } from 'react';
// import { Inter } from 'next/font/google';
// import { ThemeProvider } from '@/components/themeprovider';
// import { Button2 } from '@/components/ui/button2';
// import { Switch } from '@/components/ui/switch';
// import { Slider } from '@/components/ui/slider';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Separator } from '@/components/ui/separator';
// import { Toggle } from '@/components/ui/toggle';
// import { Checkbox } from '@/components/ui/checkbox';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import icons from '../../components/icons';
// import SegRow from '@/components/segrow';

export default function Playground() {
  return (
    <main className="my-4 mx-auto max-w-6xl py-6">
      {/* <BackgroundColorSelector /> */}

      <h2 className="section-header">Button default</h2>
      <div className="row">
        <div className="example">
          <Button
            className=""
            variant="default"
          >
            Primary Button
          </Button>
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
            className=""
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
            className=""
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
    </main>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(Playground));
