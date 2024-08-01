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

import { BackgroundColorSelect } from '../components/BackgroundColorSelect';
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
      <BackgroundColorSelect />

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

      <h2 className="section-header">Tabs</h2>
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
    </main>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(Playground));
