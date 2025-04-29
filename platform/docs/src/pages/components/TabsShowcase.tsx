import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '../../../../ui-next/src/components/Tabs';
import { Separator } from '../../../../ui-next/src/components/Separator';
import ShowcaseRow from './ShowcaseRow';

/**
 * TabsShowcase component displays Tabs variants and examples
 */
export default function TabsShowcase() {
  return (
    <ShowcaseRow
      title="Tabs"
      description="Tabs (or segmented controls) can be used to provide navigation options or allow users to switch between multiple options (e.g., tool settings) "
      code={`
<Tabs defaultValue="circle" className="w-[400px]" onValueChange={newValue => console.log(newValue)}>
  <TabsList>
    <TabsTrigger value="circle">Circle</TabsTrigger>
    <Separator orientation="vertical" />
    <TabsTrigger value="sphere">Sphere</TabsTrigger>
    <Separator orientation="vertical" />
    <TabsTrigger value="square">Square</TabsTrigger>
  </TabsList>
</Tabs>
      `}
    >
      <Tabs
        defaultValue="circle"
        className="w-[400px]"
        onValueChange={newValue => console.log(newValue)}
      >
        <TabsList>
          <TabsTrigger value="circle">Circle</TabsTrigger>
          <Separator orientation="vertical" />
          <TabsTrigger value="sphere">Sphere</TabsTrigger>
          <Separator orientation="vertical" />
          <TabsTrigger value="square">Square</TabsTrigger>
        </TabsList>
      </Tabs>
    </ShowcaseRow>
  );
}