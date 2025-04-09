---
title: ButtonGroup
---


# ButtonGroup Migration Guide

## Key Changes:

* **ButtonGroup component removed and replaced with Tabs/TabsList/TabsTrigger** - The legacy ButtonGroup component has been replaced with a more accessible Tabs component from @ohif/ui-next
* **Component naming convention transition from @ohif/ui to @ohif/ui-next** - Many UI components are transitioning to the new ui-next package
* **Styling updates with modern tailwind patterns** - Class names have been updated to follow a more consistent pattern with text-foreground/text-muted-foreground replacing specific color names
* **Segmented radio controls updated** - Radio-type controls like ButtonGroup with multiple options now use Tabs/TabsList/TabsTrigger instead
* **InputNumber replaced with Numeric component** - The old InputNumber component is replaced with a more flexible Numeric component system
* **Icons accessed through new Icons.ByName component** - Direct Icon usage replaced with Icons.ByName

## Migration Steps:

### 1. Replace ButtonGroup with Tabs Components

```diff
- <ButtonGroup className="mt-2 w-full">
-   <button
-     className="w-1/2"
-     onClick={() => {
-       setComputedView(false);
-       onDynamicClick?.();
-     }}
-   >
-     4D
-   </button>
-   <button
-     className="w-1/2"
-     onClick={() => {
-       setComputedView(true);
-     }}
-   >
-     Computed
-   </button>
- </ButtonGroup>

+ <Tabs
+   value={computedView ? 'computed' : '4d'}
+   onValueChange={value => {
+     const isComputed = value === 'computed';
+     setComputedView(isComputed);
+     if (!isComputed && typeof onDynamicClick === 'function') {
+       onDynamicClick();
+     }
+   }}
+   className="my-2 w-full"
+ >
+   <TabsList className="w-full">
+     <TabsTrigger
+       value="4d"
+       className="w-1/2"
+     >
+       4D
+     </TabsTrigger>
+     <TabsTrigger
+       value="computed"
+       className="w-1/2"
+     >
+       Computed
+     </TabsTrigger>
+   </TabsList>
+ </Tabs>
```

The `Tabs` component is a more advanced, accessible replacement for the `ButtonGroup`. Instead of directly tracking state and manually handling clicks, it uses a controlled pattern with `value` and `onValueChange`:

1. Import required components: `import { Tabs, TabsList, TabsTrigger } from '@ohif/ui-next';`
2. Set up a `value` prop on the Tabs component that maps to your state
3. Use `onValueChange` to update your state when selection changes
4. Define each tab option with `TabsTrigger` inside `TabsList`

### 2. Replace Separated ButtonGroup with Tabs

For ButtonGroups with the `separated` prop:

```diff
- <ButtonGroup
-   className={`mt-2 w-full`}
-   separated={true}
- >
-   <button
-     className="w-1/2"
-     onClick={() => setComputeViewMode(Enums.DynamicOperatorType.SUM)}
-   >
-     {Enums.DynamicOperatorType.SUM.toString().toUpperCase()}
-   </button>
-   <button
-     className="w-1/2"
-     onClick={() => setComputeViewMode(Enums.DynamicOperatorType.AVERAGE)}
-   >
-     {Enums.DynamicOperatorType.AVERAGE.toString().toUpperCase()}
-   </button>
-   <button
-     className="w-1/2"
-     onClick={() => setComputeViewMode(Enums.DynamicOperatorType.SUBTRACT)}
-   >
-     {Enums.DynamicOperatorType.SUBTRACT.toString().toUpperCase()}
-   </button>
- </ButtonGroup>

+ <Tabs
+   value={String(computeViewMode)}
+   onValueChange={value => {
+     setComputeViewMode(value);
+   }}
+   className="mt-2 w-full"
+ >
+   <TabsList className="w-full gap-1">
+     <TabsTrigger
+       value={String(Enums.DynamicOperatorType.SUM)}
+       className="w-1/3"
+     >
+       {toUpperCaseString(Enums.DynamicOperatorType.SUM)}
+     </TabsTrigger>
+     <TabsTrigger
+       value={String(Enums.DynamicOperatorType.AVERAGE)}
+       className="w-1/3"
+     >
+       {toUpperCaseString(Enums.DynamicOperatorType.AVERAGE)}
+     </TabsTrigger>
+     <TabsTrigger
+       value={String(Enums.DynamicOperatorType.SUBTRACT)}
+       className="w-1/3"
+     >
+       {toUpperCaseString(Enums.DynamicOperatorType.SUBTRACT)}
+     </TabsTrigger>
+   </TabsList>
+ </Tabs>
```

Note: For enum values, you may need to convert them to strings when using as values in the Tabs component.


```diff
- <Tooltip
-   content={<div className="text-white">{tooltip}</div>}
-   position="bottom-left"
-   tight={true}
-   tooltipBoxClassName="max-w-xs p-2"
- >
-   <Icon
-     name="info-link"
-     className="text-primary-active h-[14px] w-[14px]"
-   />
- </Tooltip>

+ <Tooltip>
+   <TooltipTrigger asChild>
+     <span>
+       <Icons.ByName
+         name="info-link"
+         className="text-primary h-3 w-3"
+       />
+     </span>
+   </TooltipTrigger>
+   <TooltipContent
+     sideOffset={4}
+     className="max-w-xs"
+   >
+     <div>{tooltip}</div>
+   </TooltipContent>
+ </Tooltip>
```

The Tooltip component has been completely redesigned to follow a more accessible pattern:
1. The main `Tooltip` component wraps everything
2. `TooltipTrigger` specifies the element that triggers the tooltip
3. `TooltipContent` defines the tooltip content

### 3. Update Button Styles and Classes

```diff
- <Button
-   className="mt-2 !h-[26px] !w-[115px] self-start !p-0"
-   onClick={() => {
-     onGenerate(computeViewMode);
-   }}
- >
-   Generate
- </Button>

+ <Button
+   variant="default"
+   size="sm"
+   className="mt-2 h-[26px] w-[115px] self-start p-0"
+   onClick={handleGenerate}
+ >
+   Generate
+ </Button>
```

Button component now uses the variant/size API instead of purely className-based styling:
1. Replace custom styles with built-in variants like "default", "primary", "secondary"
2. Use size prop ("sm", "md", "lg") instead of custom sizing
3. Remove `!` important flags from class names as the component handles priorities internally
