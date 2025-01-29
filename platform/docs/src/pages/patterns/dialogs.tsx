import * as React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../../../../ui-next/src/components/Dialog';
import { Button } from '../../../../ui-next/src/components/Button';
import { Input } from '../../../../ui-next/src/components/Input';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../../ui-next/src/components/Select';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../ui-next/src/components/Tabs';

/**
 * HotkeyPreferencesDemo
 * Uses Tabs to separate "Hotkeys" and "Language" within one dialog.
 *
 * Updated to:
 *  - Provide a responsive design that shows 2 pairs of (Function, Shortcut) at medium breakpoints,
 *    and 3 pairs of (Function, Shortcut) at large breakpoints.
 */
export default function HotkeyPreferencesDemo() {
  const [language, setLanguage] = React.useState('English (USA)');

  return (
    <div className="p-4">
      <Dialog>
        <DialogTrigger>
          <Button
            variant="default"
            size="default"
          >
            Open User Preferences
          </Button>
        </DialogTrigger>

        {/*
          We use a flex container with 80vh height for the dialog,
          ensuring the middle can scroll if content is tall.
        */}
        <DialogContent className="bg-muted text-card-foreground border-card flex h-[80vh] w-full max-w-3xl flex-col">
          {/* Header at the top */}
          <DialogHeader className="border-border shrink-0 border-b px-4 py-3">
            <DialogTitle>User Preferences</DialogTitle>
            <DialogDescription className="text-sm">
              Customize your settings such as language and keyboard shortcuts.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable content in the middle */}
          <div className="flex-1 overflow-auto px-4 py-4">
            <Tabs defaultValue="hotkeys">
              <TabsList className="mb-4">
                <TabsTrigger value="hotkeys">Hotkeys</TabsTrigger>
                <TabsTrigger value="language">Language</TabsTrigger>
              </TabsList>

              {/* Hotkeys Tab */}
              <TabsContent value="hotkeys">
                {/* Table Headers (responsive for 2 pairs on md, 3 pairs on lg) */}
                <div className="text-muted-foreground grid grid-cols-2 gap-x-6 text-sm font-medium md:grid-cols-4 lg:grid-cols-6">
                  <span>Function</span>
                  <span>Shortcut</span>
                  <span>Function</span>
                  <span>Shortcut</span>
                  {/* 3rd pair only displays at lg+ */}
                  <span className="hidden lg:inline">Function</span>
                  <span className="hidden lg:inline">Shortcut</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4 lg:grid-cols-6">
                  {/* Row 1: 3 pairs for large screens */}
                  <span>Zoom</span>
                  <Input
                    defaultValue="z"
                    type="text"
                    className="max-w-[5rem]"
                  />

                  <span>Zoom In</span>
                  <Input
                    defaultValue="+"
                    type="text"
                    className="max-w-[5rem]"
                  />

                  {/* 3rd pair only shows on lg */}
                  <span className="hidden lg:inline">Zoom Out</span>
                  <Input
                    defaultValue="-"
                    type="text"
                    className="hidden max-w-[5rem] lg:inline"
                  />

                  {/* Row 2 */}
                  <span>Zoom to Fit</span>
                  <Input
                    defaultValue="="
                    type="text"
                    className="max-w-[5rem]"
                  />

                  <span>Rotate Right</span>
                  <Input
                    defaultValue="r"
                    type="text"
                    className="max-w-[5rem]"
                  />

                  <span className="hidden lg:inline">Rotate Left</span>
                  <Input
                    defaultValue="l"
                    type="text"
                    className="hidden max-w-[5rem] lg:inline"
                  />

                  {/* Row 3 */}
                  <span>Flip Horiz.</span>
                  <Input
                    defaultValue="h"
                    type="text"
                    className="max-w-[5rem]"
                  />

                  <span>Flip Vert.</span>
                  <Input
                    defaultValue="v"
                    type="text"
                    className="max-w-[5rem]"
                  />

                  <span className="hidden lg:inline">Invert</span>
                  <Input
                    defaultValue="i"
                    type="text"
                    className="hidden max-w-[5rem] lg:inline"
                  />

                  {/* Row 4 */}
                  <span>Next Stage</span>
                  <Input
                    defaultValue="."
                    type="text"
                    className="max-w-[5rem]"
                  />

                  <span>Previous Stage</span>
                  <Input
                    defaultValue=","
                    type="text"
                    className="max-w-[5rem]"
                  />

                  <span className="hidden lg:inline">Next Image</span>
                  <Input
                    defaultValue="down"
                    type="text"
                    className="hidden max-w-[5rem] lg:inline"
                  />

                  {/* Row 5 */}
                  <span>Previous Image</span>
                  <Input
                    defaultValue="up"
                    type="text"
                    className="max-w-[5rem]"
                  />

                  <span>First Image</span>
                  <Input
                    defaultValue="home"
                    type="text"
                    className="max-w-[5rem]"
                  />

                  <span className="hidden lg:inline">Last Image</span>
                  <Input
                    defaultValue="end"
                    type="text"
                    className="hidden max-w-[5rem] lg:inline"
                  />

                  {/* Row 6 */}
                  <span>Next Viewport</span>
                  <Input
                    defaultValue="right"
                    type="text"
                    className="max-w-[5rem]"
                  />

                  <span>Previous Viewport</span>
                  <Input
                    defaultValue="left"
                    type="text"
                    className="max-w-[5rem]"
                  />

                  <span className="hidden lg:inline">Reset</span>
                  <Input
                    defaultValue="space"
                    type="text"
                    className="hidden max-w-[5rem] lg:inline"
                  />
                </div>

                {/* Additional link/button for restore defaults (matching your screenshot) */}
                <div className="mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary px-0"
                  >
                    Restore Defaults
                  </Button>
                </div>
              </TabsContent>

              {/* Language Tab */}
              <TabsContent value="language">
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm">Select your preferred language:</p>
                  <div className="flex items-center space-x-4">
                    <label
                      className="w-32 text-sm font-medium"
                      htmlFor="language"
                    >
                      Language
                    </label>
                    <Select
                      value={language}
                      onValueChange={val => setLanguage(val)}
                    >
                      <SelectTrigger
                        id="language"
                        className="w-[180px]"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English (USA)">English (USA)</SelectItem>
                        <SelectItem value="English (UK)">English (UK)</SelectItem>
                        <SelectItem value="Português (Brasil)">Português (Brasil)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer at the bottom */}
          <DialogFooter className="border-border flex shrink-0 items-center justify-between border-t px-4 py-3">
            <div /> {/* empty div if you want something aligned left, otherwise blank */}
            <div className="space-x-2">
              <DialogClose>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="default">Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
