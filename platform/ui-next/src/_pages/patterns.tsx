import React from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';

// component imports
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
import Separator from '../components/Separator';
import { Switch } from '../components/Switch';
import { Checkbox } from '../components/Checkbox';
import { Toggle, toggleVariants } from '../components/Toggle';
import { Slider } from '../components/Slider';
import { ScrollArea, ScrollBar } from '../components/ScrollArea';
import { PanelSplit } from '../components/PanelSplit';

function Patterns() {
  return (
    <div className="my-4 mx-auto max-w-6xl py-6">
      <div className="text-3xl"> Patterns </div>
      <PanelSplit />;
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(React.createElement(Patterns));
