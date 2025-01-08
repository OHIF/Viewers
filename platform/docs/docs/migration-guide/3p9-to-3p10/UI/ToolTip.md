
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

3. Replace `TooltipClipboard` with custom `makeCopyTooltipCell`:
   ```tsx
   const makeCopyTooltipCell = textValue => (
     <Tooltip>
       <TooltipTrigger asChild>
         <span className="cursor-pointer truncate">{textValue}</span>
       </TooltipTrigger>
       <TooltipContent copyEnabled copyText={textValue} side="bottom">
         {textValue}
       </TooltipContent>
     </Tooltip>
   );

   // Usage:
   content: makeCopyTooltipCell(value)
   ```

---


## 3. General Refactoring

### Migration Checklist:
1. Update all components using Tooltips:
   - `DynamicVolumeControls.tsx`
   - `TrackedCornerstoneViewport.tsx`
   - `WorkList.tsx`
   - Others as applicable.

2. Review and replace all icon usages with `Icons.ByName`.
