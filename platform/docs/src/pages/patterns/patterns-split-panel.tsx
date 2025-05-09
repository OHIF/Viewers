import React, { useState } from 'react';

import { DataRow } from '../../../../ui-next/src/components/DataRow';
import { Button } from '../../../../ui-next/src/components/Button';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '../../../../ui-next/src/components/Select';
import { Icons } from '../../../../ui-next/src/components/Icons';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../../../../ui-next/src/components/Accordion';
import { Slider } from '../../../../ui-next/src/components/Slider';
import { Switch } from '../../../../ui-next/src/components/Switch';
import { Label } from '../../../../ui-next/src/components/Label';
import { Input } from '../../../../ui-next/src/components/Input';
import { Tabs, TabsList, TabsTrigger } from '../../../../ui-next/src/components/Tabs';
import { actionOptionsMap, dataList } from '../../../../ui-next/assets/data';

interface DataItem {
  id: number;
  title: string;
  description: string;
  optionalField?: string;
  colorHex?: string;
  details?: string;
  series?: string;
}

interface ListGroup {
  type: string;
  items: DataItem[];
}

export default function SplitPanel() {
  return <div>hellosssssss</div>;
}
