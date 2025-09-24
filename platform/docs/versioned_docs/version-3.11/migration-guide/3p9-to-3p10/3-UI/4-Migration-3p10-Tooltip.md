---
title: Tooltip
summary: Migration guide for Tooltip components in OHIF 3.10, explaining the new composable structure with TooltipTrigger and TooltipContent, and replacement of TooltipClipboard with the Clipboard component.
---

##  Tooltip Updates

### Changes:
- Updated Tooltip structure to use `Tooltip`, `TooltipTrigger`, and `TooltipContent`.
- Removed deprecated `TooltipClipboard` and inline `content`/`position` properties.

### Migration Steps:
1. Replace imports:
   ```tsx
   // Before
   import { Tooltip } from '@ohif/ui';
   import { TooltipClipboard } from '@ohif/ui';

   // After
   import { Tooltip, TooltipTrigger, TooltipContent } from '@ohif/ui-next';
   ```

2. Update Tooltip usage:
   ```tsx
   // Before
   <Tooltip content={<div>Tooltip Message</div>} position="bottom-left">
     <Component />
   </Tooltip>

   // After
   <Tooltip>
     <TooltipTrigger asChild>
       <Component />
     </TooltipTrigger>
     <TooltipContent side="bottom">
       Tooltip Message
     </TooltipContent>
   </Tooltip>
   ```


3. TooltipClipboard Replacement:
The `TooltipClipboard` component has been removed. Instead, use the `Clipboard` component inside `TooltipContent` for copying text functionality.

#### Before:
```tsx
<TooltipClipboard>{text}</TooltipClipboard>
```

#### After:
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span className="cursor-pointer truncate">{text}</span>
  </TooltipTrigger>
  <TooltipContent side="bottom">
    <div className="flex items-center justify-between gap-2">
      {text}
      <Clipboard>{text}</Clipboard>
    </div>
  </TooltipContent>
</Tooltip>
```
